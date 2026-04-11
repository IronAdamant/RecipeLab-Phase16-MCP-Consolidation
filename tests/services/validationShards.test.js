'use strict';

const { describe, test, assert } = require('../testRunner');
const shards = require('../../src/services/validationShards');
const { ShardRegistry } = require('../../src/services/validationShards');
const manager = require('../../src/services/validationShards/shardManager');
const validator = require('../../src/services/validationShards/shardValidator');
const merger = require('../../src/services/validationShards/shardMerger');

const RECIPES = [
  { id: 'r1', name: 'Soup', ingredients: [{ name: 'water', quantity: 1 }] },
  { id: 'r2', name: 'Salad', ingredients: [{ name: 'lettuce', quantity: 1 }] },
  { id: 'r3', name: 'Bread', ingredients: [{ name: 'flour', quantity: 500 }] },
  { id: 'r4', name: 'Cake', ingredients: [{ name: 'sugar', quantity: 200 }] },
  { id: 'r5', name: 'Pasta', ingredients: [{ name: 'pasta', quantity: 200 }] },
  { id: 'r6', name: 'Rice', ingredients: [{ name: 'rice', quantity: 200 }] }
];

describe('validationShards.manager', () => {
  test('fnv1a is deterministic', () => {
    assert.strictEqual(manager.fnv1a('r1'), manager.fnv1a('r1'));
  });

  test('distributeRecipes spreads recipes across shards', () => {
    const distributed = manager.distributeRecipes(RECIPES, 3);
    assert.strictEqual(distributed.length, 3);
    const total = distributed.reduce((sum, s) => sum + s.recipes.length, 0);
    assert.strictEqual(total, RECIPES.length);
  });

  test('same recipe always lands in same shard', () => {
    const d1 = manager.distributeRecipes(RECIPES, 4);
    const d2 = manager.distributeRecipes(RECIPES, 4);
    for (let i = 0; i < 4; i++) {
      assert.deepStrictEqual(d1[i].recipes.map((r) => r.id), d2[i].recipes.map((r) => r.id));
    }
  });

  test('buildAgentId produces namespaced id', () => {
    assert.strictEqual(manager.buildAgentId('hub.cc.abc', 2), 'hub.cc.abc.shard.2');
  });

  test('shardIdForRecipe throws on non-positive shardCount', () => {
    assert.throws(() => manager.shardIdForRecipe('r1', 0));
  });
});

describe('validationShards.validator', () => {
  test('validateRecipe passes valid', () => {
    assert.strictEqual(validator.validateRecipe(RECIPES[0]).ok, true);
  });

  test('validateRecipe flags missing name', () => {
    const res = validator.validateRecipe({ id: 'x', ingredients: [] });
    assert.strictEqual(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('name')));
  });

  test('validateShard counts failures', () => {
    const shard = {
      shardId: 0,
      recipes: [
        RECIPES[0],
        { id: 'bad', ingredients: [] }
      ]
    };
    const report = validator.validateShard(shard);
    assert.strictEqual(report.recipeCount, 2);
    assert.strictEqual(report.failureCount, 1);
  });
});

describe('validationShards.merger', () => {
  test('mergeShardReports sums counts', () => {
    const reports = [
      { shardId: 0, recipeCount: 3, failureCount: 0, results: [] },
      { shardId: 1, recipeCount: 2, failureCount: 1, results: [] }
    ];
    const merged = merger.mergeShardReports(reports);
    assert.strictEqual(merged.totalRecipes, 5);
    assert.strictEqual(merged.totalFailures, 1);
    assert.strictEqual(merged.shardCount, 2);
  });

  test('mergeShardReports detects duplicate shardId (overwrite)', () => {
    const reports = [
      { shardId: 0, recipeCount: 1, failureCount: 0, results: [] },
      { shardId: 0, recipeCount: 2, failureCount: 0, results: [] }
    ];
    assert.throws(() => merger.mergeShardReports(reports), /duplicate shardId/);
  });

  test('mergeRaw validates and merges shards', () => {
    const distributed = manager.distributeRecipes(RECIPES, 2);
    const merged = merger.mergeRaw(distributed);
    assert.strictEqual(merged.totalRecipes, RECIPES.length);
  });
});

describe('validationShards.registry', () => {
  test('ShardRegistry assigns and releases', () => {
    const r = new ShardRegistry();
    r.assign(0, 'agent.0');
    r.assign(1, 'agent.1');
    assert.strictEqual(r.size(), 2);
    assert.strictEqual(r.agentFor(0), 'agent.0');
    assert.strictEqual(r.shardFor('agent.1'), 1);
    r.release(0);
    assert.strictEqual(r.size(), 1);
  });

  test('ShardRegistry rejects duplicate shard assignment', () => {
    const r = new ShardRegistry();
    r.assign(0, 'agent.a');
    assert.throws(() => r.assign(0, 'agent.b'), /already assigned/);
  });

  test('ShardRegistry rejects reassigning same agent', () => {
    const r = new ShardRegistry();
    r.assign(0, 'agent.a');
    assert.throws(() => r.assign(1, 'agent.a'), /already owns/);
  });

  test('ShardRegistry.assignAll creates ordered assignments', () => {
    const r = new ShardRegistry();
    const list = r.assignAll('hub.cc.parent', 3);
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].agentId, 'hub.cc.parent.shard.0');
    assert.strictEqual(list[2].agentId, 'hub.cc.parent.shard.2');
  });
});

describe('validationShards.integration', () => {
  test('planValidation creates N shards and assigns agents', () => {
    const plan = shards.planValidation(RECIPES, 3, 'hub.cc.test');
    assert.strictEqual(plan.shards.length, 3);
    assert.strictEqual(plan.registry.size(), 3);
  });

  test('runValidationSerial produces merged report with assignments', () => {
    const report = shards.runValidationSerial(RECIPES, 3, 'hub.cc.test');
    assert.strictEqual(report.totalRecipes, RECIPES.length);
    assert.strictEqual(report.totalFailures, 0);
    assert.strictEqual(report.assignments.length, 3);
  });

  test('runValidationFromReports uses external reports when provided', () => {
    const external = [
      { shardId: 0, recipeCount: 10, failureCount: 5, results: [] }
    ];
    const report = shards.runValidationFromReports(RECIPES, 3, 'hub.cc.test', external);
    assert.strictEqual(report.totalFailures >= 5, true);
  });

  test('parent-agent-id namespacing prevents shard overwrites', () => {
    const planA = shards.planValidation(RECIPES, 2, 'hub.cc.agentA');
    const planB = shards.planValidation(RECIPES, 2, 'hub.cc.agentB');
    const idsA = planA.registry.listAssignments().map((a) => a.agentId);
    const idsB = planB.registry.listAssignments().map((a) => a.agentId);
    for (const id of idsA) assert.ok(!idsB.includes(id), `overlapping agent id ${id}`);
  });
});
