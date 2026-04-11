'use strict';

const manifest = require('./bundleManifest');

function writeToBuffer(entries) {
  const { manifest: m, packet } = manifest.manifestFromEntries(entries);
  const buffer = {
    header: {
      magic: 'RLBUNDLE',
      version: 1,
      created: Date.now()
    },
    manifest: m,
    payload: packet
  };
  return buffer;
}

function serializeBuffer(buffer) {
  if (!buffer || typeof buffer !== 'object') {
    throw new Error('bundleWriter: buffer must be an object');
  }
  return JSON.stringify(buffer);
}

function parseBuffer(text) {
  if (typeof text !== 'string') {
    throw new Error('bundleWriter: text must be a string');
  }
  const parsed = JSON.parse(text);
  if (!parsed || parsed.header == null || parsed.header.magic !== 'RLBUNDLE') {
    throw new Error('bundleWriter: invalid magic');
  }
  return parsed;
}

module.exports = {
  writeToBuffer,
  serializeBuffer,
  parseBuffer
};
