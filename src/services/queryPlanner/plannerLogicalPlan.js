'use strict';

const { NodeKind } = require('./plannerAST');

const LogicalKind = Object.freeze({
  SCAN: 'LogicalScan',
  FILTER: 'LogicalFilter',
  PROJECT: 'LogicalProject',
  SORT: 'LogicalSort',
  LIMIT: 'LogicalLimit'
});

function Scan(source) {
  return { kind: LogicalKind.SCAN, source };
}
function Filter(input, predicate) {
  return { kind: LogicalKind.FILTER, input, predicate };
}
function Project(input, columns) {
  return { kind: LogicalKind.PROJECT, input, columns };
}
function Sort(input, orderItems) {
  return { kind: LogicalKind.SORT, input, orderItems };
}
function Limit(input, limit) {
  return { kind: LogicalKind.LIMIT, input, limit };
}

function fromAST(ast) {
  if (!ast || ast.kind !== NodeKind.SELECT_STMT) {
    throw new Error('plannerLogicalPlan.fromAST: expected SelectStatement');
  }
  let plan = Scan(ast.source);
  if (ast.where) plan = Filter(plan, ast.where);
  if (ast.orderBy && ast.orderBy.length) plan = Sort(plan, ast.orderBy);
  if (ast.limit != null) plan = Limit(plan, ast.limit);
  plan = Project(plan, ast.columns);
  return plan;
}

module.exports = {
  LogicalKind,
  Scan,
  Filter,
  Project,
  Sort,
  Limit,
  fromAST
};
