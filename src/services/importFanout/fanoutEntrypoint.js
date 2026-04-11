'use strict';

const root = require('./rootAggregator');

function scaleBatch(recipes, targetServings) {
  if (!Array.isArray(recipes)) {
    throw new Error('fanoutEntrypoint: recipes must be an array');
  }
  return recipes.map((r) => root.scaleRecipe(r, targetServings));
}

function analyzeBatch(recipes) {
  return root.summarizeBatch(recipes);
}

function scaleSingle(recipe, targetServings) {
  return root.scaleRecipe(recipe, targetServings);
}

module.exports = {
  scaleBatch,
  analyzeBatch,
  scaleSingle
};
