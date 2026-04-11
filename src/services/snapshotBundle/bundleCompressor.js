'use strict';

const serializer = require('./bundleSerializer');

const MIN_RUN = 4;
const MARKER = '\u0001';

function compressText(text) {
  if (typeof text !== 'string') {
    throw new Error('bundleCompressor: text must be a string');
  }
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    let run = 1;
    while (i + run < text.length && text[i + run] === ch && run < 255) {
      run++;
    }
    if (run >= MIN_RUN && ch !== MARKER && ch !== '\n') {
      out += MARKER + String.fromCharCode(run) + ch;
      i += run;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

function decompressText(text) {
  if (typeof text !== 'string') {
    throw new Error('bundleCompressor: text must be a string');
  }
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === MARKER && i + 2 < text.length) {
      const run = text.charCodeAt(i + 1);
      const ch = text[i + 2];
      out += ch.repeat(run);
      i += 3;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

function compressBundle(entries) {
  const text = serializer.serializeBundle(entries);
  return compressText(text);
}

function decompressToText(compressed) {
  return decompressText(compressed);
}

module.exports = {
  compressText,
  decompressText,
  compressBundle,
  decompressToText,
  MARKER,
  MIN_RUN
};
