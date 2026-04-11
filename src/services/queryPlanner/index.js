'use strict';

const { parse } = require('./plannerParser');
const logical = require('./plannerLogicalPlan');
const physical = require('./plannerPhysicalPlan');
const { execute } = require('./plannerExecutor');

function query(text, datasets) {
  const ast = parse(text);
  const logicalPlan = logical.fromAST(ast);
  const lowered = physical.lower(logicalPlan);
  const optimized = physical.optimize(lowered);
  return execute(optimized, datasets);
}

function explain(text) {
  const ast = parse(text);
  const logicalPlan = logical.fromAST(ast);
  const physicalPlan = physical.lower(logicalPlan);
  const optimized = physical.optimize(physicalPlan);
  return { ast, logical: logicalPlan, physical: optimized };
}

module.exports = { query, explain, parse };
