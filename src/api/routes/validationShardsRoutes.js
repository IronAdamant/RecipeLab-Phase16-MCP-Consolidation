'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const shards = require('../../services/validationShards');

const router = createRouter();

router.post('/validation-shards/plan', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.recipes)) return badRequest(res, 'recipes must be an array');
  if (!Number.isInteger(body.shardCount) || body.shardCount <= 0) {
    return badRequest(res, 'shardCount must be a positive integer');
  }
  if (typeof body.parentAgentId !== 'string' || !body.parentAgentId) {
    return badRequest(res, 'parentAgentId required');
  }
  try {
    const plan = shards.planValidation(body.recipes, body.shardCount, body.parentAgentId);
    json(res, {
      shards: plan.shards.map((s) => ({
        shardId: s.shardId,
        recipeCount: s.recipes.length,
        recipeIds: s.recipes.map((r) => r.id)
      })),
      assignments: plan.registry.listAssignments()
    });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/validation-shards/run', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.recipes)) return badRequest(res, 'recipes must be an array');
  if (!Number.isInteger(body.shardCount) || body.shardCount <= 0) {
    return badRequest(res, 'shardCount must be a positive integer');
  }
  if (typeof body.parentAgentId !== 'string' || !body.parentAgentId) {
    return badRequest(res, 'parentAgentId required');
  }
  try {
    const report = shards.runValidationSerial(body.recipes, body.shardCount, body.parentAgentId);
    json(res, report);
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/validation-shards/merge', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.reports)) return badRequest(res, 'reports must be an array');
  try {
    json(res, shards.merger.mergeShardReports(body.reports));
  } catch (err) {
    badRequest(res, err.message);
  }
});

module.exports = router;
