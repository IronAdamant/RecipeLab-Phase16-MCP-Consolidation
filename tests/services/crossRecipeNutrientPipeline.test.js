'use strict';

const { test, equal, deepEqual, ok } = require('../testRunner');
const { normalizeRecipe, normalizeAll } =
  require('../../src/services/crossRecipeNutrientPipeline/normalizer');
const { aggregate, topN } =
  require('../../src/services/crossRecipeNutrientPipeline/aggregator');
const { CrossRecipeNutrientPipeline, createPipeline } =
  require('../../src/services/crossRecipeNutrientPipeline');

const recipes = [
  { id: 'r1', servings: 4, nutrition: { protein: 20, carbs: 60, fat: 10 } },
  { id: 'r2', servings: 2, nutrition: { protein: 10, carbs: 30, fat: 5 } },
  { id: 'r3', servings: 8, nutrition: { protein: 40, carbs: 120, fat: 20 }, yield_percent: 80 }
];

test('normalizer.normalizeRecipe: scales by target servings', () => {
  const out = normalizeRecipe({ id: 'r1', servings: 4, nutrition: { protein: 20 } }, { targetServings: 8 });
  equal(out.nutrition.protein, 40);
});

test('normalizer.normalizeRecipe: applies yield loss', () => {
  const out = normalizeRecipe({ id: 'r1', servings: 1, nutrition: { protein: 100 }, yield_percent: 50 });
  equal(out.nutrition.protein, 50);
});

test('normalizer.normalizeRecipe: bad input', () => {
  equal(normalizeRecipe(null), null);
  equal(normalizeRecipe({}), null);
});

test('normalizer.normalizeRecipe: defaults targetServings to 1', () => {
  const out = normalizeRecipe({ id: 'r', servings: 2, nutrition: { x: 10 } });
  equal(out.target_servings, 1);
  equal(out.nutrition.x, 5);
});

test('normalizer.normalizeAll: filters nulls', () => {
  const out = normalizeAll([null, { id: 'r1', servings: 1, nutrition: { x: 1 } }, {}]);
  equal(out.length, 1);
});

test('normalizer.normalizeAll: empty + non-array', () => {
  deepEqual(normalizeAll([]), []);
  deepEqual(normalizeAll(null), []);
});

test('aggregator.aggregate: sums + averages', () => {
  const norm = normalizeAll(recipes);
  const out = aggregate(norm);
  ok(out.totals.protein > 0);
  equal(out.count, 3);
  equal(out.averages.protein, out.totals.protein / 3);
});

test('aggregator.aggregate: empty input', () => {
  deepEqual(aggregate([]), { totals: {}, averages: {}, count: 0 });
});

test('aggregator.aggregate: with seeds resolver', () => {
  const norm = normalizeAll(recipes);
  const out = aggregate(norm, { seeds: ['protein'] });
  ok(typeof out.totals.protein === 'number');
});

test('aggregator.topN: ranks by key descending', () => {
  const norm = normalizeAll(recipes);
  const top = topN(norm, 'protein', 2);
  equal(top.length, 2);
  ok(top[0].nutrition.protein >= top[1].nutrition.protein);
});

test('aggregator.topN: defaults n to 5', () => {
  const norm = normalizeAll(recipes);
  const out = topN(norm, 'protein', 0);
  ok(out.length <= 5);
});

test('aggregator.topN: bad input returns []', () => {
  deepEqual(topN(null, 'protein'), []);
});

test('CrossRecipeNutrientPipeline: run produces normalized + summary', () => {
  const p = createPipeline();
  const out = p.run(recipes);
  equal(out.normalized.length, 3);
  equal(out.summary.count, 3);
  ok(out.summary.totals.protein > 0);
});

test('CrossRecipeNutrientPipeline: run with target servings', () => {
  const p = createPipeline();
  const out = p.run([recipes[0]], { targetServings: 8 });
  equal(out.normalized[0].target_servings, 8);
  // doubled
  equal(out.normalized[0].nutrition.protein, 40);
});

test('CrossRecipeNutrientPipeline: rank top N', () => {
  const p = createPipeline();
  const out = p.rank(recipes, 'protein', 1);
  equal(out.length, 1);
});

test('CrossRecipeNutrientPipeline: empty recipes', () => {
  const p = createPipeline();
  const out = p.run([]);
  deepEqual(out.normalized, []);
  equal(out.summary.count, 0);
});

test('integration: yield loss propagates through pipeline', () => {
  const p = createPipeline();
  // r3 has yield_percent: 80 — protein 40 / 8 servings * 1 target = 5 -> *0.8 = 4
  const out = p.run([recipes[2]]);
  equal(out.normalized[0].nutrition.protein, 4);
});

test('integration: identity yield_percent unset', () => {
  const p = createPipeline();
  // r1 has no yield_percent (default 100) — protein 20 / 4 servings * 1 = 5
  const out = p.run([recipes[0]]);
  equal(out.normalized[0].nutrition.protein, 5);
});
