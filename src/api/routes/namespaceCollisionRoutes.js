'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const {
  dispatch,
  describe,
  listContexts,
  listFunctions,
  hasContext
} = require('../../services/namespaceCollision');

const router = createRouter();

router.get('/namespace-collision/contexts', (req, res) => {
  json(res, { contexts: listContexts(), functions: listFunctions() });
});

router.get('/namespace-collision/describe', (req, res) => {
  json(res, { contexts: describe() });
});

router.post('/namespace-collision/dispatch', (req, res) => {
  const body = req.body || {};
  const { context, fn, args } = body;
  if (typeof context !== 'string' || !hasContext(context)) {
    return badRequest(res, 'context must be a known context name');
  }
  if (typeof fn !== 'string') {
    return badRequest(res, 'fn must be a string');
  }
  if (args != null && !Array.isArray(args)) {
    return badRequest(res, 'args must be an array');
  }
  try {
    const result = dispatch(context, fn, ...(args || []));
    json(res, { context, fn, result });
  } catch (err) {
    badRequest(res, err.message);
  }
});

module.exports = router;
