'use strict';

const { describe, test, assert } = require('../testRunner');
const fanout = require('../../src/services/importFanout/fanoutEntrypoint');

const BASE_RECIPE = {
  name: 'Test Soup',
  servings: 4,
  ingredients: [
    { name: 'water', quantity: 1000, unit: 'ml' },
    { name: 'salt', quantity: 5, unit: 'g' },
    { name: 'onion', quantity: 2, unit: 'pc' }
  ],
  densityHint: { grams: 1020, milliliters: 1000 }
};

describe('importFanout.entrypoint.scaleSingle', () => {
  test('doubles ingredient quantities when target is 2x', () => {
    const scaled = fanout.scaleSingle(BASE_RECIPE, 8);
    assert.strictEqual(scaled.servings, 8);
    assert.strictEqual(scaled.ingredients[0].quantity, 2000);
    assert.strictEqual(scaled.ingredients[1].quantity, 10);
    assert.strictEqual(scaled.ingredients[2].quantity, 4);
  });

  test('halves quantities when target is 1/2x', () => {
    const scaled = fanout.scaleSingle(BASE_RECIPE, 2);
    assert.strictEqual(scaled.ingredients[0].quantity, 500);
  });

  test('adds a checksum to the scaled recipe', () => {
    const scaled = fanout.scaleSingle(BASE_RECIPE, 4);
    assert.ok(typeof scaled.checksum === 'number' && scaled.checksum > 0);
  });

  test('throws on missing recipe', () => {
    assert.throws(() => fanout.scaleSingle(null, 4));
  });
});

describe('importFanout.entrypoint.scaleBatch', () => {
  test('scales an array of recipes', () => {
    const batch = [BASE_RECIPE, Object.assign({}, BASE_RECIPE, { name: 'Second', servings: 2 })];
    const scaled = fanout.scaleBatch(batch, 4);
    assert.strictEqual(scaled.length, 2);
    assert.strictEqual(scaled[0].servings, 4);
    assert.strictEqual(scaled[1].servings, 4);
    assert.strictEqual(scaled[1].ingredients[0].quantity, 2000);
  });

  test('returns empty for empty input', () => {
    const scaled = fanout.scaleBatch([], 4);
    assert.deepStrictEqual(scaled, []);
  });

  test('throws on non-array', () => {
    assert.throws(() => fanout.scaleBatch('not-an-array', 4));
  });
});

describe('importFanout.entrypoint.analyzeBatch', () => {
  test('counts recipes', () => {
    const summary = fanout.analyzeBatch([BASE_RECIPE, BASE_RECIPE, BASE_RECIPE]);
    assert.strictEqual(summary.count, 3);
  });

  test('classifies density', () => {
    const recipe = Object.assign({}, BASE_RECIPE, {
      densityHint: { grams: 500, milliliters: 1000 }
    });
    const summary = fanout.analyzeBatch([recipe]);
    assert.strictEqual(summary.densityClasses.light + summary.densityClasses.medium, 1);
  });

  test('aggregates checksum', () => {
    const summary = fanout.analyzeBatch([BASE_RECIPE, BASE_RECIPE]);
    assert.ok(summary.totalChecksum > 0);
  });

  test('returns zero-state for non-array input', () => {
    const summary = fanout.analyzeBatch(null);
    assert.strictEqual(summary.count, 0);
  });
});
