'use strict';

const { test, equal, ok } = require('../testRunner');
const {
  clampFactor,
  scaleQuantity,
  roundToFractional,
  effectiveYield,
  applyYieldLoss
} = require('../../src/utils/ingredientYieldComputer');

test('ingredientYieldComputer.clampFactor: positive passes through', () => {
  equal(clampFactor(1.5), 1.5);
});

test('ingredientYieldComputer.clampFactor: negative becomes 0', () => {
  equal(clampFactor(-2), 0);
});

test('ingredientYieldComputer.clampFactor: NaN becomes 1', () => {
  equal(clampFactor(NaN), 1);
});

test('ingredientYieldComputer.clampFactor: Infinity becomes 1', () => {
  equal(clampFactor(Infinity), 1);
});

test('ingredientYieldComputer.scaleQuantity: scales by factor', () => {
  equal(scaleQuantity(10, 2), 20);
});

test('ingredientYieldComputer.scaleQuantity: bad quantity becomes 0', () => {
  equal(scaleQuantity('not-a-number', 2), 0);
});

test('ingredientYieldComputer.scaleQuantity: bad factor clamped to 1', () => {
  equal(scaleQuantity(10, NaN), 10);
});

test('ingredientYieldComputer.roundToFractional: 1/4 cup precision', () => {
  equal(roundToFractional(0.6, 4), 0.5);
  equal(roundToFractional(0.65, 4), 0.75);
});

test('ingredientYieldComputer.roundToFractional: invalid denominator falls back to 1', () => {
  equal(roundToFractional(2.7, 0), 3);
});

test('ingredientYieldComputer.effectiveYield: target/original', () => {
  equal(effectiveYield(4, 8), 2);
  equal(effectiveYield(8, 4), 0.5);
});

test('ingredientYieldComputer.effectiveYield: zero or negative becomes 1', () => {
  equal(effectiveYield(0, 4), 1);
  equal(effectiveYield(4, 0), 1);
  equal(effectiveYield(-1, 4), 1);
});

test('ingredientYieldComputer.applyYieldLoss: 100% returns input', () => {
  equal(applyYieldLoss(10, 100), 10);
});

test('ingredientYieldComputer.applyYieldLoss: 50% halves', () => {
  equal(applyYieldLoss(10, 50), 5);
});

test('ingredientYieldComputer.applyYieldLoss: 0 returns 0', () => {
  equal(applyYieldLoss(10, 0), 0);
});

test('ingredientYieldComputer.applyYieldLoss: NaN percent treated as 100', () => {
  equal(applyYieldLoss(7, NaN), 7);
});

test('ingredientYieldComputer.applyYieldLoss: bad quantity becomes 0', () => {
  equal(applyYieldLoss('x', 50), 0);
});
