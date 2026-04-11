'use strict';

const UNIT_TO_ML = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  oz: 29.5735,
  'fl oz': 29.5735
};

const UNIT_TO_G = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  oz: 28.3495,
  lb: 453.592
};

function convert(value, fromUnit, toUnit) {
  const volumeMap = UNIT_TO_ML;
  const massMap = UNIT_TO_G;
  if (fromUnit in volumeMap && toUnit in volumeMap) {
    return (value * volumeMap[fromUnit]) / volumeMap[toUnit];
  }
  if (fromUnit in massMap && toUnit in massMap) {
    return (value * massMap[fromUnit]) / massMap[toUnit];
  }
  throw new Error(`measurement.convert: incompatible units ${fromUnit} and ${toUnit}`);
}

function normalize(quantity) {
  if (!quantity || typeof quantity !== 'object') {
    throw new Error('measurement.normalize expects a quantity object');
  }
  const { value, unit } = quantity;
  if (unit in UNIT_TO_ML) {
    return { value: value * UNIT_TO_ML[unit], unit: 'ml', basis: 'volume' };
  }
  if (unit in UNIT_TO_G) {
    return { value: value * UNIT_TO_G[unit], unit: 'g', basis: 'mass' };
  }
  return { value, unit, basis: 'unknown' };
}

function validate(quantity) {
  if (!quantity || typeof quantity !== 'object') {
    return { ok: false, reason: 'not an object' };
  }
  if (typeof quantity.value !== 'number' || Number.isNaN(quantity.value)) {
    return { ok: false, reason: 'value must be a number' };
  }
  if (quantity.value < 0) {
    return { ok: false, reason: 'negative quantity' };
  }
  if (typeof quantity.unit !== 'string' || !quantity.unit.length) {
    return { ok: false, reason: 'unit required' };
  }
  if (!(quantity.unit in UNIT_TO_ML) && !(quantity.unit in UNIT_TO_G)) {
    return { ok: false, reason: `unknown unit ${quantity.unit}` };
  }
  return { ok: true };
}

function resolve(ref) {
  if (typeof ref !== 'string') {
    throw new Error('measurement.resolve expects a string reference');
  }
  const match = ref.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z ]+)$/);
  if (!match) {
    return null;
  }
  return { value: parseFloat(match[1]), unit: match[2].trim() };
}

module.exports = { convert, normalize, validate, resolve };
