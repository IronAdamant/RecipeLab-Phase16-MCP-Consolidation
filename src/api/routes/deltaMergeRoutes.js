'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const deltaMerge = require('../../services/deltaMerge');

const router = createRouter();

router.post('/delta-merge/diff', (req, res) => {
  const body = req.body || {};
  if (!body.before || !body.after) return badRequest(res, 'before and after required');
  try {
    json(res, { ops: deltaMerge.diff(body.before, body.after) });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/delta-merge/apply', (req, res) => {
  const body = req.body || {};
  if (!body.base || !Array.isArray(body.ops)) return badRequest(res, 'base and ops required');
  try {
    json(res, { result: deltaMerge.apply(body.base, body.ops) });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/delta-merge/merge', (req, res) => {
  const body = req.body || {};
  if (!body.base || !body.ours || !body.theirs) {
    return badRequest(res, 'base, ours, theirs required');
  }
  try {
    const result = deltaMerge.mergeRecipes(body.base, body.ours, body.theirs, body.options || {});
    json(res, result);
  } catch (err) {
    badRequest(res, err.message);
  }
});

module.exports = router;
