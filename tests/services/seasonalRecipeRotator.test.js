'use strict';

const { test, equal, deepEqual, ok } = require('../testRunner');
const {
  RULES, SEASONS, getRules, isSeason, listSeasons, tagAffinity
} = require('../../src/services/seasonalRecipeRotator/seasonRules');
const {
  eligibleFor, scoreRecipe, roundRobin, weighted, pickStrategy
} = require('../../src/services/seasonalRecipeRotator/rotationStrategy');
const { SeasonalRecipeRotator, createRotator } =
  require('../../src/services/seasonalRecipeRotator');

const recipes = [
  { id: 'r1', title: 'Pumpkin soup',     tags: ['squash', 'soup'] },
  { id: 'r2', title: 'Greek salad',      tags: ['salad', 'fresh'] },
  { id: 'r3', title: 'Beef stew',        tags: ['stew', 'comfort'] },
  { id: 'r4', title: 'Apple crumble',    tags: ['apple', 'spice'] },
  { id: 'r5', title: 'Cold pasta salad', tags: ['salad', 'cold'] }
];

test('seasonRules: SEASONS lists exactly 4 seasons', () => {
  deepEqual(SEASONS, ['winter', 'spring', 'summer', 'fall']);
});

test('seasonRules: isSeason recognizes all + rejects junk', () => {
  for (const s of SEASONS) ok(isSeason(s));
  ok(!isSeason('autumn'));
  ok(!isSeason(''));
});

test('seasonRules: listSeasons returns a copy', () => {
  const a = listSeasons(); a.push('xx');
  equal(listSeasons().length, 4);
});

test('seasonRules: getRules unknown season returns empty arrays', () => {
  deepEqual(getRules('mud_season'), { tags: [], avoidTags: [] });
});

test('seasonRules: getRules returns copies (not internal arrays)', () => {
  const r = getRules('winter');
  r.tags.push('crab');
  const r2 = getRules('winter');
  ok(r2.tags.indexOf('crab') < 0);
});

test('seasonRules: tagAffinity returns 1 / -1 / 0', () => {
  equal(tagAffinity('winter', 'soup'), 1);
  equal(tagAffinity('winter', 'cold'), -1);
  equal(tagAffinity('winter', 'unknown_tag'), 0);
  equal(tagAffinity('mud_season', 'soup'), 0);
});

test('rotationStrategy.eligibleFor: rejects recipes with avoid-tag', () => {
  ok(!eligibleFor({ tags: ['cold', 'salad'] }, 'winter'));
});

test('rotationStrategy.eligibleFor: accepts recipe with neutral tags', () => {
  ok(eligibleFor({ tags: ['soup', 'unknown_tag'] }, 'winter'));
});

test('rotationStrategy.eligibleFor: rejects bad input', () => {
  ok(!eligibleFor(null, 'winter'));
  ok(!eligibleFor({}, 'winter'));
  ok(!eligibleFor({ tags: ['soup'] }, 'mud_season'));
});

test('rotationStrategy.scoreRecipe: sums tagAffinity', () => {
  equal(scoreRecipe({ tags: ['soup', 'comfort'] }, 'winter'), 2);
  equal(scoreRecipe({ tags: ['unknown'] }, 'winter'), 0);
});

test('rotationStrategy.roundRobin: returns eligible only', () => {
  const out = roundRobin(recipes, 'winter');
  // Eligible: r1 (soup), r3 (stew, comfort), r4 (apple, spice — but spice not in winter rules so 0)
  // Excluded: r2 (salad — avoid for winter), r5 (cold — avoid for winter)
  const titles = out.map((r) => r.title);
  ok(titles.indexOf('Pumpkin soup') >= 0);
  ok(titles.indexOf('Beef stew') >= 0);
  ok(titles.indexOf('Greek salad') < 0);
  ok(titles.indexOf('Cold pasta salad') < 0);
});

test('rotationStrategy.roundRobin: offset cycles correctly', () => {
  const a = roundRobin(recipes, 'winter', { offset: 0 });
  const b = roundRobin(recipes, 'winter', { offset: 1 });
  equal(a.length, b.length);
  // first of b should equal second of a
  if (a.length >= 2) equal(b[0].id, a[1].id);
});

test('rotationStrategy.roundRobin: empty input returns []', () => {
  deepEqual(roundRobin([], 'winter'), []);
});

test('rotationStrategy.weighted: highest-score first', () => {
  const out = weighted(recipes, 'winter');
  if (out.length >= 2) ok(scoreRecipe(out[0], 'winter') >= scoreRecipe(out[1], 'winter'));
});

test('rotationStrategy.weighted: deterministic for ties', () => {
  const a = weighted(recipes, 'winter');
  const b = weighted(recipes, 'winter');
  deepEqual(a.map((r) => r.id), b.map((r) => r.id));
});

test('rotationStrategy.pickStrategy: defaults to roundRobin', () => {
  equal(pickStrategy(undefined), roundRobin);
  equal(pickStrategy('xxx'), roundRobin);
  equal(pickStrategy('weighted'), weighted);
});

test('SeasonalRecipeRotator: rotate respects strategy', () => {
  const rr = createRotator();
  const wt = createRotator({ strategy: 'weighted' });
  equal(rr.strategyName(), 'roundRobin');
  equal(wt.strategyName(), 'weighted');
  ok(rr.rotate(recipes, 'winter').length > 0);
});

test('SeasonalRecipeRotator: rotate non-array returns []', () => {
  const r = createRotator();
  deepEqual(r.rotate(null, 'winter'), []);
});

test('SeasonalRecipeRotator: rotate invalid season returns []', () => {
  const r = createRotator();
  deepEqual(r.rotate(recipes, 'mud_season'), []);
});

test('SeasonalRecipeRotator: seasons exposes all 4', () => {
  const r = createRotator();
  equal(r.seasons().length, 4);
});

test('SeasonalRecipeRotator: rulesFor delegates to seasonRules', () => {
  const r = createRotator();
  deepEqual(r.rulesFor('summer'), getRules('summer'));
});

test('integration: weighted summer favors fresh/cold-tag recipes', () => {
  const r = createRotator({ strategy: 'weighted' });
  const out = r.rotate(recipes, 'summer');
  // r2 has 'salad'+'fresh' (both +1 in summer), r5 has 'salad'+'cold' (both +1)
  if (out.length > 0) {
    const top = out[0];
    ok(top.tags.indexOf('fresh') >= 0 || top.tags.indexOf('cold') >= 0 || top.tags.indexOf('salad') >= 0);
  }
});
