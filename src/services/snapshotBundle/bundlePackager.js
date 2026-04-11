'use strict';

const encoder = require('./bundleEncoder');

const CHUNK_SIZE = 1024;

function splitIntoChunks(encoded) {
  if (typeof encoded !== 'string') {
    throw new Error('bundlePackager: encoded must be a string');
  }
  const chunks = [];
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    chunks.push(encoded.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

function joinChunks(chunks) {
  if (!Array.isArray(chunks)) {
    throw new Error('bundlePackager: chunks must be an array');
  }
  return chunks.join('');
}

function packageBundle(entries) {
  const encoded = encoder.encodeBundle(entries);
  return {
    chunks: splitIntoChunks(encoded),
    totalLength: encoded.length,
    chunkSize: CHUNK_SIZE
  };
}

function unpackage(packet) {
  if (!packet || typeof packet !== 'object' || !Array.isArray(packet.chunks)) {
    throw new Error('bundlePackager: invalid packet');
  }
  return joinChunks(packet.chunks);
}

module.exports = {
  CHUNK_SIZE,
  splitIntoChunks,
  joinChunks,
  packageBundle,
  unpackage
};
