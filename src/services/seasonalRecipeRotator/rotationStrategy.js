'use strict';

const { tagAffinity, isSeason } = require('./seasonRules');

// rotationStrategy — picks a recipe order for a season.
//   - roundRobin: deterministic cycle through eligible recipes
//   - weighted:   ranks by sum of tagAffinity scores

function eligibleFor(recipe, season) {
  if (!recipe || !Array.isArray(recipe.tags)) return false;
  if (!isSeason(season)) return false;
  // Reject if any tag has -1 affinity
  for (const t of recipe.tags) {
    if (tagAffinity(season, t) < 0) return false;
  }
  return true;
}

function scoreRecipe(recipe, season) {
  if (!recipe || !Array.isArray(recipe.tags)) return 0;
  let s = 0;
  for (const t of recipe.tags) s += tagAffinity(season, t);
  return s;
}

function roundRobin(recipes, season, opts) {
  const o = opts || {};
  const offset = typeof o.offset === 'number' ? o.offset : 0;
  const elig = recipes.filter((r) => eligibleFor(r, season));
  if (elig.length === 0) return [];
  const out = [];
  for (let i = 0; i < elig.length; i++) {
    out.push(elig[(i + offset) % elig.length]);
  }
  return out;
}

function weighted(recipes, season) {
  const elig = recipes.filter((r) => eligibleFor(r, season));
  return elig
    .map((r) => ({ r, s: scoreRecipe(r, season) }))
    .sort((a, b) => b.s - a.s)
    .map((p) => p.r);
}

function pickStrategy(name) {
  if (name === 'weighted') return weighted;
  return roundRobin;
}

module.exports = { eligibleFor, scoreRecipe, roundRobin, weighted, pickStrategy };
