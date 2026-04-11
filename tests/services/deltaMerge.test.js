'use strict';

const { describe, test, assert } = require('../testRunner');
const deltaMerge = require('../../src/services/deltaMerge');
const differ = require('../../src/services/deltaMerge/deltaDiffer');
const detector = require('../../src/services/deltaMerge/deltaConflictDetector');
const applier = require('../../src/services/deltaMerge/deltaApplier');
const strategies = require('../../src/services/deltaMerge/deltaResolutionStrategies');
const formatter = require('../../src/services/deltaMerge/deltaMarkerFormatter');
const { DeltaKind } = require('../../src/services/deltaMerge/deltaTypes');

const BASE = {
  name: 'Soup',
  servings: 4,
  ingredients: [
    { name: 'water', quantity: 1000 },
    { name: 'salt', quantity: 5 }
  ],
  tags: ['simple']
};

describe('deltaMerge.differ', () => {
  test('diff detects replaced scalar', () => {
    const ops = differ.diffRecipes(BASE, Object.assign({}, BASE, { name: 'Stew' }));
    assert.strictEqual(ops.length, 1);
    assert.strictEqual(ops[0].kind, DeltaKind.REPLACE);
    assert.strictEqual(ops[0].after, 'Stew');
  });

  test('diff detects added field', () => {
    const ops = differ.diffRecipes(BASE, Object.assign({}, BASE, { author: 'chef' }));
    assert.strictEqual(ops[0].kind, DeltaKind.ADD);
  });

  test('diff detects list append', () => {
    const after = Object.assign({}, BASE, { tags: ['simple', 'hearty'] });
    const ops = differ.diffRecipes(BASE, after);
    assert.strictEqual(ops[0].kind, DeltaKind.LIST_APPEND);
  });
});

describe('deltaMerge.applier', () => {
  test('applies replace op', () => {
    const ops = [{ kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Stew' }];
    const result = applier.applyOps(BASE, ops);
    assert.strictEqual(result.name, 'Stew');
  });

  test('applies list append', () => {
    const ops = [{ kind: DeltaKind.LIST_APPEND, path: 'tags', value: 'new' }];
    const result = applier.applyOps(BASE, ops);
    assert.ok(result.tags.includes('new'));
  });

  test('applies remove op', () => {
    const ops = [{ kind: DeltaKind.REMOVE, path: 'servings' }];
    const result = applier.applyOps(BASE, ops);
    assert.ok(!('servings' in result));
  });
});

describe('deltaMerge.detector', () => {
  test('no conflict when changing different fields', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { servings: 8 });
    const result = detector.detectFromRecipes(BASE, ours, theirs);
    assert.strictEqual(result.conflicts.length, 0);
    assert.strictEqual(result.nonConflicting.length, 2);
  });

  test('conflict when changing same field', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { name: 'Broth' });
    const result = detector.detectFromRecipes(BASE, ours, theirs);
    assert.strictEqual(result.conflicts.length, 1);
  });
});

describe('deltaMerge.strategies', () => {
  test('ours strategy keeps ours', () => {
    const conflict = {
      path: 'name',
      ours: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Stew' },
      theirs: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Broth' }
    };
    const resolved = strategies.resolveConflicts([conflict], 'ours');
    assert.strictEqual(resolved[0].after, 'Stew');
  });

  test('theirs strategy keeps theirs', () => {
    const conflict = {
      path: 'name',
      ours: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Stew' },
      theirs: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Broth' }
    };
    const resolved = strategies.resolveConflicts([conflict], 'theirs');
    assert.strictEqual(resolved[0].after, 'Broth');
  });

  test('custom strategy invoked', () => {
    const conflict = {
      path: 'name',
      ours: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Stew' },
      theirs: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Broth' }
    };
    const resolved = strategies.resolveConflicts([conflict], 'custom', (c) => {
      return Object.assign({}, c.ours, { after: 'Combined' });
    });
    assert.strictEqual(resolved[0].after, 'Combined');
  });
});

describe('deltaMerge.formatter', () => {
  test('formats markers', () => {
    const conflict = {
      path: 'name',
      ours: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Stew' },
      theirs: { kind: DeltaKind.REPLACE, path: 'name', before: 'Soup', after: 'Broth' }
    };
    const formatted = formatter.formatConflict(conflict);
    assert.ok(formatted.includes('<<<<<<< OURS'));
    assert.ok(formatted.includes('>>>>>>> THEIRS'));
  });
});

describe('deltaMerge.threeWayMerge', () => {
  test('merges non-conflicting changes cleanly', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { servings: 8 });
    const result = deltaMerge.mergeRecipes(BASE, ours, theirs);
    assert.strictEqual(result.merged.name, 'Stew');
    assert.strictEqual(result.merged.servings, 8);
    assert.strictEqual(result.conflicts.length, 0);
  });

  test('ours strategy picks our value on conflict', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { name: 'Broth' });
    const result = deltaMerge.mergeRecipes(BASE, ours, theirs, { strategy: 'ours' });
    assert.strictEqual(result.merged.name, 'Stew');
  });

  test('theirs strategy picks their value on conflict', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { name: 'Broth' });
    const result = deltaMerge.mergeRecipes(BASE, ours, theirs, { strategy: 'theirs' });
    assert.strictEqual(result.merged.name, 'Broth');
  });

  test('markers strategy leaves base value but emits markers', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { name: 'Broth' });
    const result = deltaMerge.mergeRecipes(BASE, ours, theirs, { strategy: 'markers' });
    assert.ok(result.markers.length > 0);
    assert.strictEqual(result.conflicts.length, 1);
  });

  test('summary counts conflicts', () => {
    const ours = Object.assign({}, BASE, { name: 'Stew' });
    const theirs = Object.assign({}, BASE, { name: 'Broth' });
    const result = deltaMerge.mergeRecipes(BASE, ours, theirs);
    assert.strictEqual(result.summary.total, 1);
  });
});
