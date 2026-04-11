'use strict';

const ALIASES = {
  'scallion': 'green onion',
  'spring onion': 'green onion',
  'coriander': 'cilantro',
  'aubergine': 'eggplant',
  'courgette': 'zucchini',
  'capsicum': 'bell pepper'
};

function convert(ingredient, targetForm) {
  if (!ingredient || typeof ingredient !== 'object') {
    throw new Error('ingredient.convert expects an ingredient object');
  }
  const { name, form } = ingredient;
  if (form === targetForm) return ingredient;
  if (form === 'whole' && targetForm === 'chopped') {
    return Object.assign({}, ingredient, { form: 'chopped', pieces: (ingredient.pieces || 1) * 8 });
  }
  if (form === 'whole' && targetForm === 'diced') {
    return Object.assign({}, ingredient, { form: 'diced', pieces: (ingredient.pieces || 1) * 16 });
  }
  if (form === 'chopped' && targetForm === 'minced') {
    return Object.assign({}, ingredient, { form: 'minced', pieces: (ingredient.pieces || 1) * 4 });
  }
  return Object.assign({}, ingredient, { form: targetForm });
}

function normalize(name) {
  if (typeof name !== 'string') {
    throw new Error('ingredient.normalize expects a string');
  }
  const lower = name.trim().toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  return lower;
}

function validate(ingredient) {
  if (!ingredient || typeof ingredient !== 'object') {
    return { ok: false, reason: 'not an object' };
  }
  if (typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
    return { ok: false, reason: 'name required' };
  }
  if (ingredient.quantity != null && typeof ingredient.quantity !== 'number') {
    return { ok: false, reason: 'quantity must be a number' };
  }
  if (ingredient.allergens && !Array.isArray(ingredient.allergens)) {
    return { ok: false, reason: 'allergens must be an array' };
  }
  return { ok: true };
}

function resolve(nameOrAlias) {
  if (typeof nameOrAlias !== 'string') return null;
  const normalized = normalize(nameOrAlias);
  return { canonical: normalized, aliases: Object.keys(ALIASES).filter((k) => ALIASES[k] === normalized) };
}

module.exports = { convert, normalize, validate, resolve };
