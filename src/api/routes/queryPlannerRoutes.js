'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const planner = require('../../services/queryPlanner');

const router = createRouter();

router.post('/query-planner/query', (req, res) => {
  const body = req.body || {};
  if (typeof body.text !== 'string') return badRequest(res, 'text required');
  if (!body.datasets || typeof body.datasets !== 'object') return badRequest(res, 'datasets required');
  try {
    json(res, { results: planner.query(body.text, body.datasets) });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/query-planner/explain', (req, res) => {
  const body = req.body || {};
  if (typeof body.text !== 'string') return badRequest(res, 'text required');
  try {
    json(res, planner.explain(body.text));
  } catch (err) {
    badRequest(res, err.message);
  }
});

module.exports = router;
