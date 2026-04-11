'use strict';

const mid = require('./midTransformer');

function scaleRecipe(recipe, targetServings) {
  if (!recipe || typeof recipe !== 'object') {
    throw new Error('rootAggregator: recipe must be an object');
  }
  const sourceServings = recipe.servings || 1;
  const scaledIngredients = mid.scaleIngredients(
    recipe.ingredients || [],
    sourceServings,
    targetServings
  );
  return Object.assign({}, recipe, {
    servings: targetServings,
    ingredients: scaledIngredients,
    checksum: mid.computeRecipeChecksum(recipe)
  });
}

function summarizeBatch(recipes) {
  const summary = {
    count: 0,
    totalChecksum: 0,
    densityClasses: { light: 0, medium: 0, dense: 0, unknown: 0 }
  };
  if (!Array.isArray(recipes)) return summary;
  for (const r of recipes) {
    summary.count++;
    summary.totalChecksum += mid.computeRecipeChecksum(r);
    const density = r.densityHint || {};
    const cls = mid.classifyDensity(density.grams, density.milliliters);
    summary.densityClasses[cls]++;
  }
  return summary;
}

module.exports = {
  scaleRecipe,
  summarizeBatch
};
