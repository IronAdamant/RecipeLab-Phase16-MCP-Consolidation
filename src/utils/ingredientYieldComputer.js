'use strict';

// ingredientYieldComputer — small math util for ingredient yield/scale
// calculations. Pure functions. Imported by Recipe model and scaling service
// to create a multi-hop test impact chain for Chisel.

function clampFactor(factor) {
  if (typeof factor !== 'number' || !Number.isFinite(factor)) return 1;
  if (factor < 0) return 0;
  return factor;
}

function scaleQuantity(quantity, factor) {
  const f = clampFactor(factor);
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return 0;
  return quantity * f;
}

function roundToFractional(value, denominator) {
  const d = denominator > 0 ? denominator : 1;
  return Math.round(value * d) / d;
}

function effectiveYield(originalServings, targetServings) {
  const o = Number(originalServings);
  const t = Number(targetServings);
  if (!Number.isFinite(o) || o <= 0) return 1;
  if (!Number.isFinite(t) || t <= 0) return 1;
  return t / o;
}

function applyYieldLoss(quantity, yieldPercent) {
  const q = typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : 0;
  const p = typeof yieldPercent === 'number' && Number.isFinite(yieldPercent) ? yieldPercent : 100;
  if (p <= 0) return 0;
  if (p >= 100) return q;
  return q * (p / 100);
}

module.exports = {
  clampFactor,
  scaleQuantity,
  roundToFractional,
  effectiveYield,
  applyYieldLoss
};
