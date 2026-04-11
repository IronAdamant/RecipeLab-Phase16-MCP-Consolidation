'use strict';

const SMART_QUOTES = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-'
};

function convert(text, targetCase) {
  if (typeof text !== 'string') {
    throw new Error('textual.convert expects a string');
  }
  switch (targetCase) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case 'sentence':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    default:
      throw new Error(`textual.convert: unknown case ${targetCase}`);
  }
}

function normalize(text) {
  if (typeof text !== 'string') {
    throw new Error('textual.normalize expects a string');
  }
  let out = text;
  for (const [k, v] of Object.entries(SMART_QUOTES)) {
    out = out.split(k).join(v);
  }
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function validate(text, opts) {
  const options = opts || {};
  if (typeof text !== 'string') {
    return { ok: false, reason: 'not a string' };
  }
  if (options.minLength != null && text.length < options.minLength) {
    return { ok: false, reason: `length ${text.length} < min ${options.minLength}` };
  }
  if (options.maxLength != null && text.length > options.maxLength) {
    return { ok: false, reason: `length ${text.length} > max ${options.maxLength}` };
  }
  if (options.allowNewlines === false && /\n/.test(text)) {
    return { ok: false, reason: 'newlines disallowed' };
  }
  return { ok: true };
}

function resolve(reference) {
  if (typeof reference !== 'string') return null;
  const match = reference.match(/^@(\w+)(?::(\w+))?$/);
  if (!match) return null;
  return { entity: match[1], field: match[2] || 'name' };
}

module.exports = { convert, normalize, validate, resolve };
