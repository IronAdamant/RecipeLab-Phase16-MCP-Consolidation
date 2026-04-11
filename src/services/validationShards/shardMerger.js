'use strict';

const validator = require('./shardValidator');

function mergeShardReports(reports) {
  if (!Array.isArray(reports)) {
    throw new Error('shardMerger: reports must be an array');
  }
  const seenShardIds = new Set();
  let totalRecipes = 0;
  let totalFailures = 0;
  const allResults = [];
  const perShardSummary = [];

  for (const report of reports) {
    if (!report || typeof report !== 'object') continue;
    if (seenShardIds.has(report.shardId)) {
      throw new Error(`shardMerger: duplicate shardId ${report.shardId} — overwrite detected`);
    }
    seenShardIds.add(report.shardId);
    totalRecipes += report.recipeCount || 0;
    totalFailures += report.failureCount || 0;
    if (Array.isArray(report.results)) {
      for (const r of report.results) {
        allResults.push(Object.assign({ shardId: report.shardId }, r));
      }
    }
    perShardSummary.push({
      shardId: report.shardId,
      recipeCount: report.recipeCount || 0,
      failureCount: report.failureCount || 0
    });
  }

  perShardSummary.sort((a, b) => a.shardId - b.shardId);

  return {
    totalRecipes,
    totalFailures,
    shardCount: seenShardIds.size,
    perShard: perShardSummary,
    results: allResults
  };
}

function mergeRaw(shards) {
  if (!Array.isArray(shards)) {
    throw new Error('shardMerger: shards must be an array');
  }
  const reports = shards.map((s) => validator.validateShard(s));
  return mergeShardReports(reports);
}

module.exports = { mergeShardReports, mergeRaw };
