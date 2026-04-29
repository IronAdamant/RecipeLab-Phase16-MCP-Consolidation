'use strict';

const { test, equal, deepEqual, ok } = require('../testRunner');
const { composeBreakfastSlot, scoreBreakfast } =
  require('../../src/services/parallelMealPlanComposer/regionA_breakfast');
const { composeLunchSlot, scoreLunch } =
  require('../../src/services/parallelMealPlanComposer/regionB_lunch');
const { composeDinnerSlot, scoreDinner } =
  require('../../src/services/parallelMealPlanComposer/regionC_dinner');
const { composeSnackSlot, scoreSnack } =
  require('../../src/services/parallelMealPlanComposer/regionD_snacks');
const { composeMealPlan, listSlots, SLOT_FNS } =
  require('../../src/services/parallelMealPlanComposer');

const recipes = [
  { id: 'b1', tags: ['breakfast', 'eggs', 'pancake'] },
  { id: 'b2', tags: ['oatmeal', 'breakfast'] },
  { id: 'l1', tags: ['lunch', 'salad', 'sandwich'] },
  { id: 'l2', tags: ['soup'] },
  { id: 'd1', tags: ['dinner', 'roast', 'pasta'] },
  { id: 'd2', tags: ['curry'] },
  { id: 's1', tags: ['snack', 'fruit', 'nuts'] },
  { id: 'unknown', tags: ['random_tag'] }
];

// Region A — breakfast
test('regionA composeBreakfastSlot: picks highest-tag-score breakfast', () => {
  const out = composeBreakfastSlot(recipes);
  ok(out !== null);
  equal(out.slot, 'breakfast');
  equal(out.recipe.id, 'b1'); // 3 matching tags
  equal(out.score, 3);
});

test('regionA composeBreakfastSlot: returns null when no breakfast', () => {
  equal(composeBreakfastSlot([{ id: 'x', tags: ['random'] }]), null);
});

test('regionA composeBreakfastSlot: rejects bad input', () => {
  equal(composeBreakfastSlot(null), null);
  equal(composeBreakfastSlot('not-array'), null);
});

test('regionA scoreBreakfast: counts matching tags', () => {
  equal(scoreBreakfast({ tags: ['breakfast', 'eggs'] }, ['breakfast', 'eggs', 'oatmeal']), 2);
  equal(scoreBreakfast({}, ['breakfast']), 0);
});

// Region B — lunch
test('regionB composeLunchSlot: picks lunch recipe', () => {
  const out = composeLunchSlot(recipes);
  ok(out !== null);
  equal(out.slot, 'lunch');
  equal(out.recipe.id, 'l1');
});

test('regionB composeLunchSlot: returns null when no lunch', () => {
  equal(composeLunchSlot([{ id: 'x', tags: ['random'] }]), null);
});

test('regionB scoreLunch: counts matching tags', () => {
  equal(scoreLunch({ tags: ['lunch', 'soup'] }, ['lunch', 'soup', 'salad']), 2);
});

// Region C — dinner
test('regionC composeDinnerSlot: picks dinner recipe', () => {
  const out = composeDinnerSlot(recipes);
  ok(out !== null);
  equal(out.slot, 'dinner');
  equal(out.recipe.id, 'd1'); // 3 matching tags
});

test('regionC composeDinnerSlot: returns null when no dinner', () => {
  equal(composeDinnerSlot([{ id: 'x', tags: ['random'] }]), null);
});

test('regionC scoreDinner: counts matching tags', () => {
  equal(scoreDinner({ tags: ['dinner', 'curry'] }, ['dinner', 'curry']), 2);
});

// Region D — snack
test('regionD composeSnackSlot: picks snack recipe', () => {
  const out = composeSnackSlot(recipes);
  ok(out !== null);
  equal(out.slot, 'snack');
  equal(out.recipe.id, 's1');
});

test('regionD composeSnackSlot: returns null when no snack', () => {
  equal(composeSnackSlot([{ id: 'x', tags: ['random'] }]), null);
});

test('regionD scoreSnack: counts matching tags', () => {
  equal(scoreSnack({ tags: ['snack', 'nuts'] }, ['snack', 'nuts']), 2);
});

// Facade
test('composeMealPlan: full plan with all 4 slots', () => {
  const out = composeMealPlan(recipes);
  ok(out.plan.breakfast);
  ok(out.plan.lunch);
  ok(out.plan.dinner);
  ok(out.plan.snack);
  deepEqual(out.missing, []);
});

test('composeMealPlan: subset of slots', () => {
  const out = composeMealPlan(recipes, { slots: ['breakfast', 'lunch'] });
  ok(out.plan.breakfast);
  ok(out.plan.lunch);
  ok(!out.plan.dinner);
  deepEqual(out.missing, []);
});

test('composeMealPlan: unknown slot in list reported as missing', () => {
  const out = composeMealPlan(recipes, { slots: ['breakfast', 'midnight_feast'] });
  ok(out.plan.breakfast);
  ok(out.missing.indexOf('midnight_feast') >= 0);
});

test('composeMealPlan: missing slot when no candidate', () => {
  const breakfastOnly = recipes.filter((r) => r.tags && r.tags.indexOf('breakfast') >= 0);
  const out = composeMealPlan(breakfastOnly);
  ok(out.plan.breakfast);
  ok(out.missing.indexOf('lunch') >= 0);
  ok(out.missing.indexOf('dinner') >= 0);
  ok(out.missing.indexOf('snack') >= 0);
});

test('composeMealPlan: bad input returns empty plan + all missing', () => {
  const out = composeMealPlan(null);
  deepEqual(out.plan, {});
  equal(out.missing.length, 4);
});

test('composeMealPlan: empty recipes', () => {
  const out = composeMealPlan([]);
  deepEqual(out.plan, {});
  equal(out.missing.length, 4);
});

test('listSlots: returns all 4 default slots', () => {
  deepEqual(listSlots(), ['breakfast', 'lunch', 'dinner', 'snack']);
});

test('SLOT_FNS: all 4 region functions wired', () => {
  ok(typeof SLOT_FNS.breakfast === 'function');
  ok(typeof SLOT_FNS.lunch === 'function');
  ok(typeof SLOT_FNS.dinner === 'function');
  ok(typeof SLOT_FNS.snack === 'function');
});
