'use strict';

const { createRouter } = require('../../utils/router');
const { json, badRequest } = require('../../utils/response');
const orchestrator = require('../../services/snapshotBundle/bundleOrchestrator');

const router = createRouter();

router.post('/snapshot-bundle/create', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.entries)) return badRequest(res, 'entries must be an array');
  try {
    const result = orchestrator.createBundle(body.entries);
    json(res, {
      serialized: result.serialized,
      manifest: result.buffer.manifest,
      header: result.buffer.header
    });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/snapshot-bundle/load', (req, res) => {
  const body = req.body || {};
  if (typeof body.serialized !== 'string') return badRequest(res, 'serialized must be a string');
  try {
    const result = orchestrator.loadBundle(body.serialized);
    json(res, {
      entries: result.entries,
      manifest: result.buffer.manifest
    });
  } catch (err) {
    badRequest(res, err.message);
  }
});

router.post('/snapshot-bundle/roundtrip', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.entries)) return badRequest(res, 'entries must be an array');
  try {
    const result = orchestrator.roundTrip(body.entries);
    json(res, {
      ok: true,
      roundTripped: result.loaded.entries,
      manifest: result.created.buffer.manifest
    });
  } catch (err) {
    badRequest(res, err.message);
  }
});

module.exports = router;
