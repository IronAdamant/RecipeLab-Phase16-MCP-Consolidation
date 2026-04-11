'use strict';

const { LogicalKind } = require('./plannerLogicalPlan');

const PhysicalKind = Object.freeze({
  SEQ_SCAN: 'PhysicalSeqScan',
  FILTER: 'PhysicalFilter',
  PROJECT: 'PhysicalProject',
  SORT: 'PhysicalSort',
  LIMIT: 'PhysicalLimit'
});

function lower(logical) {
  if (!logical || !logical.kind) {
    throw new Error('plannerPhysicalPlan.lower: logical plan required');
  }
  switch (logical.kind) {
    case LogicalKind.SCAN:
      return { kind: PhysicalKind.SEQ_SCAN, source: logical.source };
    case LogicalKind.FILTER:
      return { kind: PhysicalKind.FILTER, input: lower(logical.input), predicate: logical.predicate };
    case LogicalKind.PROJECT:
      return { kind: PhysicalKind.PROJECT, input: lower(logical.input), columns: logical.columns };
    case LogicalKind.SORT:
      return { kind: PhysicalKind.SORT, input: lower(logical.input), orderItems: logical.orderItems };
    case LogicalKind.LIMIT:
      return { kind: PhysicalKind.LIMIT, input: lower(logical.input), limit: logical.limit };
    default:
      throw new Error(`plannerPhysicalPlan.lower: unknown kind ${logical.kind}`);
  }
}

function pushDownFilter(plan) {
  if (!plan) return plan;
  if (plan.input) plan.input = pushDownFilter(plan.input);
  if (plan.kind === PhysicalKind.PROJECT && plan.input && plan.input.kind === PhysicalKind.FILTER) {
    const filter = plan.input;
    plan.input = filter.input;
    filter.input = plan;
    return filter;
  }
  return plan;
}

function optimize(plan) {
  return pushDownFilter(plan);
}

module.exports = { PhysicalKind, lower, pushDownFilter, optimize };
