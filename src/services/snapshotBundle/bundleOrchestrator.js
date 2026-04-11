'use strict';

const writer = require('./bundleWriter');
const verifier = require('./bundleVerifier');

function createBundle(entries) {
  const buffer = writer.writeToBuffer(entries);
  const verification = verifier.verifyBuffer(buffer);
  if (!verification.ok) {
    throw new Error(`bundleOrchestrator: verification failed after write: ${verification.reason}`);
  }
  return {
    buffer,
    serialized: writer.serializeBuffer(buffer),
    verification
  };
}

function loadBundle(serialized) {
  const buffer = writer.parseBuffer(serialized);
  const verification = verifier.verifyBuffer(buffer);
  if (!verification.ok) {
    throw new Error(`bundleOrchestrator: verification failed on load: ${verification.reason}`);
  }
  return { buffer, entries: verification.entries };
}

function roundTrip(entries) {
  const created = createBundle(entries);
  const loaded = loadBundle(created.serialized);
  return { created, loaded };
}

module.exports = {
  createBundle,
  loadBundle,
  roundTrip
};
