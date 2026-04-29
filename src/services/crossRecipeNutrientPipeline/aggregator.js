'use strict';

const { resolveRecipeNutrients } = require('../recipeNutrientResolver');

// Aggregator — sums + averages normalized nutrients across many recipes.

function aggregate(normalized, opts) {
  if (!Array.isArray(normalized) || normalized.length === 0) {
    return { totals: {}, averages: {}, count: 0 };
  }
  const o = opts || {};
  const seeds = Array.isArray(o.seeds) ? o.seeds : null;
  const totals = {};
  let count = 0;
  for (const n of normalized) {
    if (!n || !n.nutrition) continue;
    count += 1;
    const view = seeds
      ? resolveRecipeNutrients({ nutrition: n.nutrition }, { seeds })
      : n.nutrition;
    for (const k of Object.keys(view)) {
      totals[k] = (totals[k] || 0) + Number(view[k] || 0);
    }
  }
  const averages = {};
  for (const k of Object.keys(totals)) {
    averages[k] = count > 0 ? totals[k] / count : 0;
  }
  return { totals, averages, count };
}

function topN(normalized, key, n) {
  if (!Array.isArray(normalized)) return [];
  const lim = n > 0 ? n : 5;
  return normalized
    .filter((x) => x && x.nutrition && typeof x.nutrition[key] === 'number')
    .sort((a, b) => b.nutrition[key] - a.nutrition[key])
    .slice(0, lim);
}

module.exports = { aggregate, topN };
