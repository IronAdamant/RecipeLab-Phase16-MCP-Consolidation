'use strict';

const { effectiveYield, applyYieldLoss } = require('../../utils/ingredientYieldComputer');

// Normalize recipes to a common per-serving nutrient view.
function normalizeRecipe(recipe, opts) {
  if (!recipe || !recipe.nutrition) return null;
  const o = opts || {};
  const targetServings = typeof o.targetServings === 'number' && o.targetServings > 0
    ? o.targetServings : 1;
  const yieldFactor = effectiveYield(recipe.servings || 1, targetServings);
  const out = { recipe_id: recipe.id, target_servings: targetServings, nutrition: {} };
  for (const k of Object.keys(recipe.nutrition)) {
    const raw = Number(recipe.nutrition[k] || 0);
    const scaled = raw * yieldFactor;
    out.nutrition[k] = applyYieldLoss(scaled, recipe.yield_percent);
  }
  return out;
}

function normalizeAll(recipes, opts) {
  if (!Array.isArray(recipes)) return [];
  return recipes.map((r) => normalizeRecipe(r, opts)).filter((x) => x !== null);
}

module.exports = { normalizeRecipe, normalizeAll };
