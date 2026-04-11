'use strict';

const manager = require('./shardManager');
const validator = require('./shardValidator');
const merger = require('./shardMerger');
const { ShardRegistry } = require('./shardRegistry');

function planValidation(recipes, shardCount, parentAgentId) {
  const shards = manager.distributeRecipes(recipes, shardCount);
  const registry = new ShardRegistry();
  registry.assignAll(parentAgentId, shardCount);
  return { shards, registry };
}

function runValidationSerial(recipes, shardCount, parentAgentId) {
  const plan = planValidation(recipes, shardCount, parentAgentId);
  const reports = plan.shards.map((shard) => {
    const report = validator.validateShard(shard);
    report.agentId = plan.registry.agentFor(shard.shardId);
    return report;
  });
  const merged = merger.mergeShardReports(reports);
  merged.assignments = plan.registry.listAssignments();
  return merged;
}

function runValidationFromReports(recipes, shardCount, parentAgentId, externalReports) {
  const plan = planValidation(recipes, shardCount, parentAgentId);
  const byShardId = new Map();
  for (const r of externalReports || []) {
    if (r && Number.isInteger(r.shardId)) byShardId.set(r.shardId, r);
  }
  const finalReports = plan.shards.map((shard) => {
    if (byShardId.has(shard.shardId)) {
      return byShardId.get(shard.shardId);
    }
    const report = validator.validateShard(shard);
    report.agentId = plan.registry.agentFor(shard.shardId);
    return report;
  });
  const merged = merger.mergeShardReports(finalReports);
  merged.assignments = plan.registry.listAssignments();
  return merged;
}

module.exports = {
  planValidation,
  runValidationSerial,
  runValidationFromReports,
  manager,
  validator,
  merger,
  ShardRegistry
};
