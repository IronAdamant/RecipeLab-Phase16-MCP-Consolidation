'use strict';

const detector = require('./deltaConflictDetector');
const strategies = require('./deltaResolutionStrategies');
const applier = require('./deltaApplier');
const formatter = require('./deltaMarkerFormatter');

function threeWayMerge(base, ours, theirs, options) {
  const opts = options || {};
  const strategy = opts.strategy || 'ours';
  const customFn = opts.customFn;

  const detected = detector.detectFromRecipes(base, ours, theirs);
  const allNonConflicting = detected.nonConflicting.map((n) => n.op);

  let resolvedConflictOps = [];
  let markers = '';
  if (detected.conflicts.length > 0) {
    if (strategy === 'markers') {
      markers = formatter.formatAll(detected.conflicts);
    } else {
      resolvedConflictOps = strategies.resolveConflicts(detected.conflicts, strategy, customFn);
    }
  }

  const finalOps = allNonConflicting.concat(resolvedConflictOps);
  const merged = applier.applyOps(base, finalOps);
  return {
    merged,
    conflicts: detected.conflicts,
    nonConflicting: detected.nonConflicting,
    oursOps: detected.oursOps,
    theirsOps: detected.theirsOps,
    markers,
    summary: formatter.summarizeConflicts(detected.conflicts),
    strategy
  };
}

module.exports = { threeWayMerge };
