'use strict';

function computeYieldFactor(servings, targetServings) {
  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error('leafCalculator: servings must be positive');
  }
  if (!Number.isFinite(targetServings) || targetServings <= 0) {
    throw new Error('leafCalculator: targetServings must be positive');
  }
  return targetServings / servings;
}

function computeDensity(grams, milliliters) {
  if (!Number.isFinite(grams) || !Number.isFinite(milliliters) || milliliters === 0) {
    return 0;
  }
  return grams / milliliters;
}

function computeChecksum(parts) {
  if (!Array.isArray(parts)) return 0;
  let sum = 0;
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) {
      sum = (sum * 31 + p.charCodeAt(i)) >>> 0;
    }
  }
  return sum;
}

function computeRatio(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

module.exports = {
  computeYieldFactor,
  computeDensity,
  computeChecksum,
  computeRatio
};
