'use strict';

const { getContext, listContexts, listFunctions, hasContext } = require('./collisionRegistry');

function dispatch(contextName, fnName, ...args) {
  const ctx = getContext(contextName);
  if (typeof ctx[fnName] !== 'function') {
    throw new Error(`namespaceCollision: ${contextName}.${fnName} is not a function`);
  }
  return ctx[fnName](...args);
}

function convert(contextName, ...args) {
  return dispatch(contextName, 'convert', ...args);
}

function normalize(contextName, ...args) {
  return dispatch(contextName, 'normalize', ...args);
}

function validate(contextName, ...args) {
  return dispatch(contextName, 'validate', ...args);
}

function resolve(contextName, ...args) {
  return dispatch(contextName, 'resolve', ...args);
}

function describe() {
  const out = {};
  for (const name of listContexts()) {
    out[name] = listFunctions();
  }
  return out;
}

module.exports = {
  dispatch,
  convert,
  normalize,
  validate,
  resolve,
  describe,
  listContexts,
  listFunctions,
  hasContext
};
