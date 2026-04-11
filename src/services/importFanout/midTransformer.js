'use strict';

const leaf = require('./leafCalculator');

function scaleIngredient(ingredient, sourceServings, targetServings) {
  const factor = leaf.computeYieldFactor(sourceServings, targetServings);
  return Object.assign({}, ingredient, {
    quantity: (ingredient.quantity || 0) * factor
  });
}

function scaleIngredients(ingredients, sourceServings, targetServings) {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map((i) => scaleIngredient(i, sourceServings, targetServings));
}

function computeRecipeChecksum(recipe) {
  const parts = [];
  parts.push(recipe.name || '');
  for (const ing of recipe.ingredients || []) {
    parts.push(ing.name || '');
    parts.push(String(ing.quantity || 0));
    parts.push(ing.unit || '');
  }
  return leaf.computeChecksum(parts);
}

function classifyDensity(grams, milliliters) {
  const density = leaf.computeDensity(grams, milliliters);
  if (density === 0) return 'unknown';
  if (density < 0.5) return 'light';
  if (density < 1.1) return 'medium';
  return 'dense';
}

module.exports = {
  scaleIngredient,
  scaleIngredients,
  computeRecipeChecksum,
  classifyDensity
};
