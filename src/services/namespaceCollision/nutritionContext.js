'use strict';

const KCAL_TO_KJ = 4.184;
const PROTEIN_KCAL_PER_G = 4;
const CARB_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

function convert(amount, fromUnit, toUnit) {
  if (fromUnit === 'kcal' && toUnit === 'kJ') return amount * KCAL_TO_KJ;
  if (fromUnit === 'kJ' && toUnit === 'kcal') return amount / KCAL_TO_KJ;
  if (fromUnit === toUnit) return amount;
  throw new Error(`nutrition.convert: unsupported ${fromUnit}->${toUnit}`);
}

function normalize(nutrients) {
  if (!nutrients || typeof nutrients !== 'object') {
    throw new Error('nutrition.normalize expects an object');
  }
  const out = {
    calories_kcal: nutrients.calories_kcal || 0,
    protein_g: nutrients.protein_g || 0,
    carbs_g: nutrients.carbs_g || 0,
    fat_g: nutrients.fat_g || 0
  };
  if (out.calories_kcal === 0) {
    out.calories_kcal =
      out.protein_g * PROTEIN_KCAL_PER_G +
      out.carbs_g * CARB_KCAL_PER_G +
      out.fat_g * FAT_KCAL_PER_G;
  }
  return out;
}

function validate(nutrients) {
  if (!nutrients || typeof nutrients !== 'object') {
    return { ok: false, reason: 'not an object' };
  }
  for (const key of ['calories_kcal', 'protein_g', 'carbs_g', 'fat_g']) {
    if (nutrients[key] != null && (typeof nutrients[key] !== 'number' || nutrients[key] < 0)) {
      return { ok: false, reason: `${key} must be a non-negative number` };
    }
  }
  const n = normalize(nutrients);
  const computed =
    n.protein_g * PROTEIN_KCAL_PER_G +
    n.carbs_g * CARB_KCAL_PER_G +
    n.fat_g * FAT_KCAL_PER_G;
  if (computed > 0 && n.calories_kcal > 0) {
    const delta = Math.abs(computed - n.calories_kcal) / n.calories_kcal;
    if (delta > 0.25) {
      return { ok: false, reason: `calorie/macro mismatch (${delta.toFixed(2)})` };
    }
  }
  return { ok: true };
}

function resolve(label) {
  if (typeof label !== 'string') return null;
  const lookup = {
    'kcal': { unit: 'kcal', kind: 'energy' },
    'kJ': { unit: 'kJ', kind: 'energy' },
    'g': { unit: 'g', kind: 'mass' },
    'mg': { unit: 'mg', kind: 'mass' },
    'IU': { unit: 'IU', kind: 'activity' }
  };
  return lookup[label] || null;
}

module.exports = { convert, normalize, validate, resolve };
