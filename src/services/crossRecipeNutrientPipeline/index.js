'use strict';

const { normalizeAll } = require('./normalizer');
const { aggregate, topN } = require('./aggregator');

class CrossRecipeNutrientPipeline {
  constructor(opts) { this._opts = opts || {}; }

  run(recipes, opts) {
    const o = Object.assign({}, this._opts, opts || {});
    const normalized = normalizeAll(recipes, o);
    const summary = aggregate(normalized, o);
    return { normalized, summary };
  }

  rank(recipes, key, n) {
    return topN(normalizeAll(recipes, this._opts), key, n);
  }
}

function createPipeline(opts) { return new CrossRecipeNutrientPipeline(opts); }

module.exports = { CrossRecipeNutrientPipeline, createPipeline, normalizeAll, aggregate, topN };
