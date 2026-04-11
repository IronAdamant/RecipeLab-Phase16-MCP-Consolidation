'use strict';

const reader = require('./bundleReader');
const manifest = require('./bundleManifest');

function verifyBuffer(buffer) {
  if (!buffer || !buffer.manifest || !buffer.payload) {
    return { ok: false, reason: 'missing manifest or payload' };
  }
  const structure = manifest.verifyManifestStructure(buffer.manifest);
  if (!structure.ok) return structure;

  const expected = buffer.manifest.chunkChecksums;
  const actual = buffer.payload.chunks.map(manifest.checksum);
  if (expected.length !== actual.length) {
    return { ok: false, reason: 'chunk count mismatch' };
  }
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) {
      return { ok: false, reason: `chunk ${i} checksum mismatch` };
    }
  }

  let entries;
  try {
    entries = reader.readFromBuffer(buffer);
  } catch (err) {
    return { ok: false, reason: `read error: ${err.message}` };
  }
  const entryValidation = reader.validateReadEntries(entries);
  if (!entryValidation.ok) return entryValidation;

  if (entries.length !== buffer.manifest.entryCount) {
    return { ok: false, reason: 'entryCount mismatch' };
  }
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].id !== buffer.manifest.entryIds[i]) {
      return { ok: false, reason: `entry ${i} id mismatch` };
    }
  }
  return { ok: true, entries };
}

module.exports = { verifyBuffer };
