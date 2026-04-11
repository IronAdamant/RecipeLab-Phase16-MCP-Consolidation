'use strict';

const packager = require('./bundlePackager');

function checksum(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

function buildManifest(entries, packet) {
  if (!Array.isArray(entries)) {
    throw new Error('bundleManifest: entries must be an array');
  }
  if (!packet || !Array.isArray(packet.chunks)) {
    throw new Error('bundleManifest: invalid packet');
  }
  return {
    entryCount: entries.length,
    chunkCount: packet.chunks.length,
    totalLength: packet.totalLength,
    chunkSize: packet.chunkSize,
    chunkChecksums: packet.chunks.map(checksum),
    entryIds: entries.map((e) => e.id)
  };
}

function manifestFromEntries(entries) {
  const packet = packager.packageBundle(entries);
  return { manifest: buildManifest(entries, packet), packet };
}

function verifyManifestStructure(manifest) {
  if (!manifest || typeof manifest !== 'object') return { ok: false, reason: 'not an object' };
  if (!Array.isArray(manifest.chunkChecksums)) return { ok: false, reason: 'chunkChecksums missing' };
  if (!Array.isArray(manifest.entryIds)) return { ok: false, reason: 'entryIds missing' };
  return { ok: true };
}

module.exports = {
  checksum,
  buildManifest,
  manifestFromEntries,
  verifyManifestStructure
};
