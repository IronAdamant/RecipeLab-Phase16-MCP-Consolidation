'use strict';

const { describe, test, assert } = require('../testRunner');
const {
  dispatch,
  convert,
  normalize,
  validate,
  resolve,
  describe: describeRegistry,
  listContexts,
  listFunctions,
  hasContext
} = require('../../src/services/namespaceCollision');
const measurement = require('../../src/services/namespaceCollision/measurementContext');
const ingredient = require('../../src/services/namespaceCollision/ingredientContext');
const nutrition = require('../../src/services/namespaceCollision/nutritionContext');
const temporal = require('../../src/services/namespaceCollision/temporalContext');
const textual = require('../../src/services/namespaceCollision/textualContext');

describe('namespaceCollision.registry', () => {
  test('listContexts returns all 5 contexts', () => {
    const contexts = listContexts();
    assert.deepStrictEqual(contexts.sort(), ['ingredient', 'measurement', 'nutrition', 'temporal', 'textual']);
  });

  test('listFunctions returns shared function names', () => {
    assert.deepStrictEqual(listFunctions().sort(), ['convert', 'normalize', 'resolve', 'validate']);
  });

  test('hasContext returns true for known contexts', () => {
    assert.strictEqual(hasContext('measurement'), true);
    assert.strictEqual(hasContext('unknown'), false);
  });

  test('describe returns a 5x4 matrix', () => {
    const desc = describeRegistry();
    assert.strictEqual(Object.keys(desc).length, 5);
    for (const fns of Object.values(desc)) {
      assert.strictEqual(fns.length, 4);
    }
  });
});

describe('namespaceCollision.measurement', () => {
  test('convert ml to cup', () => {
    const result = measurement.convert(236.588, 'ml', 'cup');
    assert.ok(Math.abs(result - 1) < 0.001);
  });

  test('convert g to oz', () => {
    const result = measurement.convert(28.3495, 'g', 'oz');
    assert.ok(Math.abs(result - 1) < 0.001);
  });

  test('convert throws on incompatible units', () => {
    assert.throws(() => measurement.convert(100, 'ml', 'g'));
  });

  test('normalize volume to ml', () => {
    const result = measurement.normalize({ value: 1, unit: 'cup' });
    assert.strictEqual(result.unit, 'ml');
    assert.strictEqual(result.basis, 'volume');
  });

  test('validate rejects negative', () => {
    const result = measurement.validate({ value: -1, unit: 'ml' });
    assert.strictEqual(result.ok, false);
  });

  test('resolve parses "250 ml"', () => {
    const result = measurement.resolve('250 ml');
    assert.deepStrictEqual(result, { value: 250, unit: 'ml' });
  });

  test('dispatch measurement.convert', () => {
    const result = dispatch('measurement', 'convert', 1000, 'ml', 'l');
    assert.strictEqual(result, 1);
  });
});

describe('namespaceCollision.ingredient', () => {
  test('convert whole to chopped multiplies pieces', () => {
    const result = ingredient.convert({ name: 'onion', form: 'whole', pieces: 1 }, 'chopped');
    assert.strictEqual(result.form, 'chopped');
    assert.strictEqual(result.pieces, 8);
  });

  test('normalize aliases scallion to green onion', () => {
    assert.strictEqual(ingredient.normalize('Scallion'), 'green onion');
  });

  test('normalize aliases aubergine to eggplant', () => {
    assert.strictEqual(ingredient.normalize('Aubergine'), 'eggplant');
  });

  test('validate rejects empty name', () => {
    const result = ingredient.validate({ name: '' });
    assert.strictEqual(result.ok, false);
  });

  test('resolve finds canonical + aliases', () => {
    const result = ingredient.resolve('coriander');
    assert.strictEqual(result.canonical, 'cilantro');
    assert.ok(result.aliases.includes('coriander'));
  });

  test('dispatch ingredient.normalize', () => {
    assert.strictEqual(dispatch('ingredient', 'normalize', 'Capsicum'), 'bell pepper');
  });
});

describe('namespaceCollision.nutrition', () => {
  test('convert kcal to kJ', () => {
    const result = nutrition.convert(100, 'kcal', 'kJ');
    assert.ok(Math.abs(result - 418.4) < 0.01);
  });

  test('normalize computes calories from macros', () => {
    const result = nutrition.normalize({ protein_g: 10, carbs_g: 20, fat_g: 5 });
    assert.strictEqual(result.calories_kcal, 10 * 4 + 20 * 4 + 5 * 9);
  });

  test('validate catches macro mismatch', () => {
    const result = nutrition.validate({ calories_kcal: 100, protein_g: 50, carbs_g: 50, fat_g: 50 });
    assert.strictEqual(result.ok, false);
  });

  test('resolve known units', () => {
    assert.strictEqual(nutrition.resolve('kcal').kind, 'energy');
    assert.strictEqual(nutrition.resolve('mg').kind, 'mass');
  });

  test('dispatch nutrition.convert', () => {
    const result = dispatch('nutrition', 'convert', 418.4, 'kJ', 'kcal');
    assert.ok(Math.abs(result - 100) < 0.01);
  });
});

describe('namespaceCollision.temporal', () => {
  test('convert minutes to hours', () => {
    assert.strictEqual(temporal.convert(60, 'min', 'hr'), 1);
  });

  test('normalize string to minutes', () => {
    const result = temporal.normalize('30 min');
    assert.strictEqual(result.unit, 'minutes');
    assert.strictEqual(result.value, 30);
  });

  test('validate rejects negative duration', () => {
    assert.strictEqual(temporal.validate(-5).ok, false);
  });

  test('resolve "2 hours"', () => {
    const result = temporal.resolve('2 hours');
    assert.strictEqual(result.value, 2);
    assert.strictEqual(result.unit, 'hours');
  });

  test('dispatch temporal.convert', () => {
    assert.strictEqual(dispatch('temporal', 'convert', 2, 'hr', 'min'), 120);
  });
});

describe('namespaceCollision.textual', () => {
  test('convert to upper', () => {
    assert.strictEqual(textual.convert('hello', 'upper'), 'HELLO');
  });

  test('convert to title', () => {
    assert.strictEqual(textual.convert('hello world', 'title'), 'Hello World');
  });

  test('normalize collapses whitespace and smart quotes', () => {
    assert.strictEqual(textual.normalize('  \u201Chello\u201D  '), '"hello"');
  });

  test('validate enforces minLength', () => {
    const result = textual.validate('hi', { minLength: 5 });
    assert.strictEqual(result.ok, false);
  });

  test('resolve @recipe:name', () => {
    const result = textual.resolve('@recipe:name');
    assert.deepStrictEqual(result, { entity: 'recipe', field: 'name' });
  });

  test('dispatch textual.normalize', () => {
    const result = dispatch('textual', 'normalize', '  hello   world  ');
    assert.strictEqual(result, 'hello world');
  });
});

describe('namespaceCollision.crossContext', () => {
  test('same function name dispatches to different implementations', () => {
    assert.strictEqual(dispatch('measurement', 'convert', 1000, 'ml', 'l'), 1);
    assert.strictEqual(dispatch('temporal', 'convert', 60, 'min', 'hr'), 1);
    assert.ok(Math.abs(dispatch('nutrition', 'convert', 1, 'kcal', 'kJ') - 4.184) < 0.001);
  });

  test('normalize has 5 distinct implementations', () => {
    const results = {
      measurement: normalize('measurement', { value: 1, unit: 'cup' }),
      ingredient: normalize('ingredient', 'Scallion'),
      nutrition: normalize('nutrition', { protein_g: 1, carbs_g: 1, fat_g: 1 }),
      temporal: normalize('temporal', 60),
      textual: normalize('textual', '  hello  ')
    };
    assert.strictEqual(typeof results.measurement, 'object');
    assert.strictEqual(typeof results.ingredient, 'string');
    assert.strictEqual(typeof results.nutrition, 'object');
    assert.strictEqual(typeof results.temporal, 'object');
    assert.strictEqual(typeof results.textual, 'string');
  });

  test('validate returns ok:true for all 5 with valid input', () => {
    assert.strictEqual(validate('measurement', { value: 1, unit: 'ml' }).ok, true);
    assert.strictEqual(validate('ingredient', { name: 'salt' }).ok, true);
    assert.strictEqual(validate('nutrition', { protein_g: 1 }).ok, true);
    assert.strictEqual(validate('temporal', 30).ok, true);
    assert.strictEqual(validate('textual', 'ok').ok, true);
  });

  test('resolve yields different kinds per context', () => {
    assert.deepStrictEqual(resolve('measurement', '250 ml'), { value: 250, unit: 'ml' });
    assert.strictEqual(resolve('temporal', '30 min').value, 30);
    assert.strictEqual(resolve('nutrition', 'kcal').kind, 'energy');
  });
});
