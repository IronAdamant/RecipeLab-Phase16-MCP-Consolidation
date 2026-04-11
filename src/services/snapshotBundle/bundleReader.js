'use strict';

const schema = require('./bundleSchema');
const serializer = require('../snapshotBundle/bundleSerializer');
const compressor = require('../snapshotBundle/bundleCompressor');
const encoder = require('../snapshotBundle/bundleEncoder');
const packager = require('../snapshotBundle/bundlePackager');

function readFromBuffer(buffer) {
  if (!buffer || buffer.payload == null) {
    throw new Error('bundleReader: invalid buffer');
  }
  const encoded = packager.unpackage(buffer.payload);
  const compressed = encoder.decodeFromBase64(encoded);
  const text = compressor.decompressText(compressed);
  return serializer.deserializeBundle(text);
}

function readSingleFromText(text) {
  if (!text.length) return [];
  return serializer.deserializeBundle(text);
}

function validateReadEntries(entries) {
  if (!Array.isArray(entries)) return { ok: false, reason: 'not an array' };
  for (const e of entries) {
    if (!schema.isValidEntry(e)) {
      return { ok: false, reason: `invalid entry ${e && e.id}` };
    }
  }
  return { ok: true };
}

module.exports = {
  readFromBuffer,
  readSingleFromText,
  validateReadEntries
};
