'use strict';

const CURRENT_VERSION = 1;

const REQUIRED_FIELDS = ['id', 'name', 'ingredients', 'instructions'];

function entryShape() {
  return {
    version: CURRENT_VERSION,
    id: '',
    name: '',
    ingredients: [],
    instructions: [],
    tags: [],
    metadata: {}
  };
}

function isValidEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) return false;
  }
  if (!Array.isArray(entry.ingredients)) return false;
  if (!Array.isArray(entry.instructions)) return false;
  return true;
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return { ok: false, reason: 'not an object' };
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      return { ok: false, reason: `missing field ${field}` };
    }
  }
  if (!Array.isArray(entry.ingredients)) {
    return { ok: false, reason: 'ingredients must be array' };
  }
  if (!Array.isArray(entry.instructions)) {
    return { ok: false, reason: 'instructions must be array' };
  }
  return { ok: true };
}

module.exports = {
  CURRENT_VERSION,
  REQUIRED_FIELDS,
  entryShape,
  isValidEntry,
  validateEntry
};
