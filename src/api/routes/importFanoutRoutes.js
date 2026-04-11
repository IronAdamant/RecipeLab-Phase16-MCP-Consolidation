'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const { scaleBatch, analyzeBatch, scaleSingle } = require('../../services/importFanout');

const router = createRouter();

router.post('/import-fanout/scale-single', (req, res) => {
  const body = req.body || {};
  if (!body.recipe) return badRequest(res, 'recipe required');
  if (!Number.isFinite(body.targetServings)) return badRequest(res, 'targetServings required');
  try {
    json(res, { recipe: scaleSingle(body.recipe, body.targetServings) });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/import-fanout/scale-batch', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.recipes)) return badRequest(res, 'recipes must be an array');
  if (!Number.isFinite(body.targetServings)) return badRequest(res, 'targetServings required');
  try {
    json(res, { recipes: scaleBatch(body.recipes, body.targetServings) });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/import-fanout/analyze', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.recipes)) return badRequest(res, 'recipes must be an array');
  json(res, { summary: analyzeBatch(body.recipes) });
});

module.exports = router;
