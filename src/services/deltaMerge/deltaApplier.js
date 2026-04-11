'use strict';

const { DeltaKind } = require('./deltaTypes');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pathParts(path) {
  return path ? path.split('.') : [];
}

function getParentAndKey(root, path) {
  const parts = pathParts(path);
  if (parts.length === 0) return { parent: null, key: null };
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  return { parent: cur, key: parts[parts.length - 1] };
}

function applyOp(root, op) {
  if (!op) return root;
  const { parent, key } = getParentAndKey(root, op.path);
  switch (op.kind) {
    case DeltaKind.ADD:
      if (parent) parent[key] = op.value;
      break;
    case DeltaKind.REMOVE:
      if (parent && key in parent) delete parent[key];
      break;
    case DeltaKind.REPLACE:
      if (parent) parent[key] = op.after;
      break;
    case DeltaKind.LIST_APPEND: {
      if (!parent) break;
      if (!Array.isArray(parent[key])) parent[key] = [];
      parent[key].push(op.value);
      break;
    }
    case DeltaKind.LIST_REMOVE: {
      if (!parent || !Array.isArray(parent[key])) break;
      const needle = JSON.stringify(op.value);
      parent[key] = parent[key].filter((x) => JSON.stringify(x) !== needle);
      break;
    }
    default:
      throw new Error(`deltaApplier: unknown op kind ${op.kind}`);
  }
  return root;
}

function applyOps(base, ops) {
  if (!Array.isArray(ops)) {
    throw new Error('deltaApplier: ops must be an array');
  }
  const out = deepClone(base || {});
  for (const op of ops) applyOp(out, op);
  return out;
}

module.exports = { applyOp, applyOps, deepClone };
