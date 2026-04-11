'use strict';

const measurement = require('./measurementContext');
const ingredient = require('./ingredientContext');
const nutrition = require('./nutritionContext');
const temporal = require('./temporalContext');
const textual = require('./textualContext');

const contexts = {
  measurement,
  ingredient,
  nutrition,
  temporal,
  textual
};

function getContext(name) {
  const ctx = contexts[name];
  if (!ctx) {
    throw new Error(`collisionRegistry: unknown context ${name}`);
  }
  return ctx;
}

function listContexts() {
  return Object.keys(contexts);
}

function listFunctions() {
  return ['convert', 'normalize', 'validate', 'resolve'];
}

function hasContext(name) {
  return name in contexts;
}

module.exports = { getContext, listContexts, listFunctions, hasContext };
