'use strict';

const types = require('./deltaTypes');
const differ = require('./deltaDiffer');
const detector = require('./deltaConflictDetector');
const strategies = require('./deltaResolutionStrategies');
const applier = require('./deltaApplier');
const formatter = require('./deltaMarkerFormatter');
const { threeWayMerge } = require('./deltaThreeWayMerger');

function mergeRecipes(base, ours, theirs, options) {
  return threeWayMerge(base, ours, theirs, options);
}

function diff(before, after) {
  return differ.diffRecipes(before, after);
}

function apply(base, ops) {
  return applier.applyOps(base, ops);
}

module.exports = {
  mergeRecipes,
  diff,
  apply,
  threeWayMerge,
  types,
  differ,
  detector,
  strategies,
  applier,
  formatter
};
