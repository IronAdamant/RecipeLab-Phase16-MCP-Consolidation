'use strict';

const UNIT_TO_SECONDS = {
  s: 1,
  sec: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hour: 3600,
  hours: 3600
};

function convert(value, fromUnit, toUnit) {
  if (!(fromUnit in UNIT_TO_SECONDS) || !(toUnit in UNIT_TO_SECONDS)) {
    throw new Error(`temporal.convert: unknown unit ${fromUnit} or ${toUnit}`);
  }
  return (value * UNIT_TO_SECONDS[fromUnit]) / UNIT_TO_SECONDS[toUnit];
}

function normalize(duration) {
  if (typeof duration === 'number') {
    return { value: duration, unit: 'minutes' };
  }
  if (typeof duration === 'string') {
    const parsed = resolve(duration);
    if (parsed) return normalize(parsed);
    throw new Error(`temporal.normalize: could not parse ${duration}`);
  }
  if (!duration || typeof duration !== 'object') {
    throw new Error('temporal.normalize expects number/string/object');
  }
  if (!(duration.unit in UNIT_TO_SECONDS)) {
    throw new Error(`temporal.normalize: unknown unit ${duration.unit}`);
  }
  const seconds = duration.value * UNIT_TO_SECONDS[duration.unit];
  return { value: seconds / 60, unit: 'minutes' };
}

function validate(duration) {
  if (duration == null) {
    return { ok: false, reason: 'duration required' };
  }
  if (typeof duration === 'number') {
    return duration >= 0
      ? { ok: true }
      : { ok: false, reason: 'negative duration' };
  }
  if (typeof duration === 'object' && 'value' in duration && 'unit' in duration) {
    if (typeof duration.value !== 'number' || duration.value < 0) {
      return { ok: false, reason: 'value must be non-negative number' };
    }
    if (!(duration.unit in UNIT_TO_SECONDS)) {
      return { ok: false, reason: `unknown unit ${duration.unit}` };
    }
    return { ok: true };
  }
  return { ok: false, reason: 'unsupported shape' };
}

function resolve(text) {
  if (typeof text !== 'string') return null;
  const match = text.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$/);
  if (!match) return null;
  const unit = match[2].toLowerCase();
  if (!(unit in UNIT_TO_SECONDS)) return null;
  return { value: parseFloat(match[1]), unit };
}

module.exports = { convert, normalize, validate, resolve };
