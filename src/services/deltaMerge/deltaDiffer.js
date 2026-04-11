'use strict';

const types = require('./deltaTypes');

function isObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function diffValues(path, before, after) {
  if (before === undefined && after !== undefined) {
    return [types.addOp(path, after)];
  }
  if (before !== undefined && after === undefined) {
    return [types.removeOp(path, before)];
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    return diffArrays(path, before, after);
  }
  if (isObject(before) && isObject(after)) {
    return diffObjects(path, before, after);
  }
  if (before !== after) {
    return [types.replaceOp(path, before, after)];
  }
  return [];
}

function diffObjects(path, before, after) {
  const ops = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key;
    ops.push(...diffValues(childPath, before[key], after[key]));
  }
  return ops;
}

function diffArrays(path, before, after) {
  const ops = [];
  const beforeSet = new Set(before.map((v) => JSON.stringify(v)));
  const afterSet = new Set(after.map((v) => JSON.stringify(v)));
  for (const val of after) {
    if (!beforeSet.has(JSON.stringify(val))) {
      ops.push(types.listAppendOp(path, val));
    }
  }
  for (const val of before) {
    if (!afterSet.has(JSON.stringify(val))) {
      ops.push(types.listRemoveOp(path, val));
    }
  }
  return ops;
}

function diffRecipes(before, after) {
  if (!isObject(before) || !isObject(after)) {
    throw new Error('deltaDiffer.diffRecipes: expects recipe objects');
  }
  return diffObjects('', before, after);
}

module.exports = { diffValues, diffObjects, diffArrays, diffRecipes };
