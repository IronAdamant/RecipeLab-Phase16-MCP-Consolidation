'use strict';

const TYPES = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RENAME: 'rename',
  MERGE: 'merge'
});

const ALL = Object.freeze(Object.values(TYPES));

function isValidType(t) {
  return ALL.indexOf(t) >= 0;
}

function validateDelta(delta) {
  if (!delta || typeof delta !== 'object') return { ok: false, error: 'delta must be object' };
  if (!isValidType(delta.type))             return { ok: false, error: 'invalid type' };
  if (typeof delta.recipe_id !== 'string' || !delta.recipe_id) {
    return { ok: false, error: 'recipe_id required' };
  }
  if (delta.type === 'rename' && !delta.from) {
    return { ok: false, error: 'rename requires from' };
  }
  return { ok: true };
}

module.exports = { TYPES, ALL, isValidType, validateDelta };
