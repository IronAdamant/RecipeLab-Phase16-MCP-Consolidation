'use strict';

const schema = require('./bundleSchema');

function serializeEntry(entry) {
  const validation = schema.validateEntry(entry);
  if (!validation.ok) {
    throw new Error(`bundleSerializer: ${validation.reason}`);
  }
  const normalized = Object.assign({}, schema.entryShape(), entry);
  return JSON.stringify(normalized);
}

function serializeBundle(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('bundleSerializer: entries must be an array');
  }
  const lines = entries.map(serializeEntry);
  return lines.join('\n');
}

function deserializeEntry(line) {
  if (typeof line !== 'string') {
    throw new Error('bundleSerializer: line must be a string');
  }
  const parsed = JSON.parse(line);
  if (!schema.isValidEntry(parsed)) {
    throw new Error('bundleSerializer: deserialized entry is invalid');
  }
  return parsed;
}

function deserializeBundle(text) {
  if (typeof text !== 'string') {
    throw new Error('bundleSerializer: text must be a string');
  }
  if (text.length === 0) return [];
  return text.split('\n').map(deserializeEntry);
}

module.exports = {
  serializeEntry,
  serializeBundle,
  deserializeEntry,
  deserializeBundle
};
