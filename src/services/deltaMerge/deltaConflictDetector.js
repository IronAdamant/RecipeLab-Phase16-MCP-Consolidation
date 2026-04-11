'use strict';

const { DeltaKind } = require('./deltaTypes');
const differ = require('./deltaDiffer');

function indexByPath(ops) {
  const map = new Map();
  for (const op of ops) {
    if (!map.has(op.path)) map.set(op.path, []);
    map.get(op.path).push(op);
  }
  return map;
}

function opsConflict(a, b) {
  if (a.kind === DeltaKind.REPLACE && b.kind === DeltaKind.REPLACE) {
    return JSON.stringify(a.after) !== JSON.stringify(b.after);
  }
  if (a.kind === DeltaKind.ADD && b.kind === DeltaKind.ADD) {
    return JSON.stringify(a.value) !== JSON.stringify(b.value);
  }
  if (a.kind === DeltaKind.REPLACE && b.kind === DeltaKind.REMOVE) return true;
  if (a.kind === DeltaKind.REMOVE && b.kind === DeltaKind.REPLACE) return true;
  return false;
}

function detectConflicts(oursOps, theirsOps) {
  const oursMap = indexByPath(oursOps);
  const theirsMap = indexByPath(theirsOps);
  const conflicts = [];
  const nonConflicting = [];
  const oursMatched = new Set();
  const theirsMatched = new Set();

  for (const [path, oOps] of oursMap.entries()) {
    const tOps = theirsMap.get(path);
    if (!tOps) continue;
    for (const o of oOps) {
      for (const t of tOps) {
        if (opsConflict(o, t)) {
          conflicts.push({ path, ours: o, theirs: t });
          oursMatched.add(o);
          theirsMatched.add(t);
        }
      }
    }
  }

  for (const op of oursOps) {
    if (!oursMatched.has(op)) nonConflicting.push({ source: 'ours', op });
  }
  for (const op of theirsOps) {
    if (!theirsMatched.has(op)) nonConflicting.push({ source: 'theirs', op });
  }

  return { conflicts, nonConflicting };
}

function detectFromRecipes(base, ours, theirs) {
  const oursOps = differ.diffRecipes(base, ours);
  const theirsOps = differ.diffRecipes(base, theirs);
  const result = detectConflicts(oursOps, theirsOps);
  result.oursOps = oursOps;
  result.theirsOps = theirsOps;
  return result;
}

module.exports = { indexByPath, opsConflict, detectConflicts, detectFromRecipes };
