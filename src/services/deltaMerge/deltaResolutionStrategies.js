'use strict';

const { DeltaKind } = require('./deltaTypes');

function resolveOurs(conflict) {
  return conflict.ours;
}

function resolveTheirs(conflict) {
  return conflict.theirs;
}

function resolveUnion(conflict) {
  const { ours, theirs } = conflict;
  if (ours.kind === DeltaKind.LIST_APPEND && theirs.kind === DeltaKind.LIST_APPEND) {
    return [ours, theirs];
  }
  if (ours.kind === DeltaKind.REPLACE && theirs.kind === DeltaKind.REPLACE) {
    const combined = `${ours.after} / ${theirs.after}`;
    return { kind: DeltaKind.REPLACE, path: ours.path, before: ours.before, after: combined };
  }
  return [ours, theirs];
}

const STRATEGIES = {
  ours: resolveOurs,
  theirs: resolveTheirs,
  union: resolveUnion
};

function resolveConflicts(conflicts, strategyName, customFn) {
  if (!Array.isArray(conflicts)) {
    throw new Error('deltaResolutionStrategies: conflicts must be an array');
  }
  let fn;
  if (strategyName === 'custom') {
    if (typeof customFn !== 'function') {
      throw new Error('deltaResolutionStrategies: custom strategy requires a function');
    }
    fn = customFn;
  } else {
    fn = STRATEGIES[strategyName];
    if (!fn) {
      throw new Error(`deltaResolutionStrategies: unknown strategy ${strategyName}`);
    }
  }
  const resolved = [];
  for (const c of conflicts) {
    const out = fn(c);
    if (Array.isArray(out)) resolved.push(...out);
    else if (out) resolved.push(out);
  }
  return resolved;
}

module.exports = {
  resolveOurs,
  resolveTheirs,
  resolveUnion,
  resolveConflicts,
  STRATEGIES
};
