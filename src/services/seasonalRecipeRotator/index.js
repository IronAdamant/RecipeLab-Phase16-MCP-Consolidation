'use strict';

const seasonRules = require('./seasonRules');
const rotation = require('./rotationStrategy');

class SeasonalRecipeRotator {
  constructor(opts) {
    const o = opts || {};
    this._strategy = rotation.pickStrategy(o.strategy);
    this._strategyName = o.strategy === 'weighted' ? 'weighted' : 'roundRobin';
  }

  rotate(recipes, season, extra) {
    if (!Array.isArray(recipes)) return [];
    if (!seasonRules.isSeason(season)) return [];
    return this._strategy(recipes, season, extra || {});
  }

  rulesFor(season) {
    return seasonRules.getRules(season);
  }

  seasons() {
    return seasonRules.listSeasons();
  }

  strategyName() {
    return this._strategyName;
  }
}

function createRotator(opts) {
  return new SeasonalRecipeRotator(opts);
}

module.exports = { SeasonalRecipeRotator, createRotator, seasonRules, rotation };
