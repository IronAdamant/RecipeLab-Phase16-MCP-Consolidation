'use strict';

const compressor = require('./bundleCompressor');

function encodeToBase64(text) {
  if (typeof text !== 'string') {
    throw new Error('bundleEncoder: text must be a string');
  }
  return Buffer.from(text, 'binary').toString('base64');
}

function decodeFromBase64(encoded) {
  if (typeof encoded !== 'string') {
    throw new Error('bundleEncoder: encoded must be a string');
  }
  return Buffer.from(encoded, 'base64').toString('binary');
}

function encodeBundle(entries) {
  const compressed = compressor.compressBundle(entries);
  return encodeToBase64(compressed);
}

function decodeBundle(encoded) {
  const compressed = decodeFromBase64(encoded);
  return compressor.decompressToText(compressed);
}

module.exports = {
  encodeToBase64,
  decodeFromBase64,
  encodeBundle,
  decodeBundle
};
