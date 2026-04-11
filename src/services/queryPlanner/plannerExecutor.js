'use strict';

const { NodeKind } = require('./plannerAST');
const { PhysicalKind } = require('./plannerPhysicalPlan');

function evalExpr(expr, row) {
  if (!expr) return null;
  switch (expr.kind) {
    case NodeKind.LITERAL:
      return expr.value;
    case NodeKind.COLUMN_REF:
      return row[expr.name];
    case NodeKind.BINARY_EXPR: {
      const l = evalExpr(expr.left, row);
      const r = evalExpr(expr.right, row);
      switch (expr.op) {
        case '=': return l == r;
        case '!=': return l != r;
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        case 'AND': return l && r;
        case 'OR': return l || r;
        default:
          throw new Error(`plannerExecutor: unknown op ${expr.op}`);
      }
    }
    default:
      throw new Error(`plannerExecutor: unknown expr kind ${expr.kind}`);
  }
}

function projectRow(row, columns) {
  if (columns.length === 1 && columns[0].kind === NodeKind.STAR) {
    return row;
  }
  const out = {};
  for (const col of columns) {
    if (col.kind === NodeKind.COLUMN_REF) {
      out[col.name] = row[col.name];
    }
  }
  return out;
}

function compareRows(a, b, orderItems) {
  for (const item of orderItems) {
    const av = a[item.column];
    const bv = b[item.column];
    if (av < bv) return item.direction === 'desc' ? 1 : -1;
    if (av > bv) return item.direction === 'desc' ? -1 : 1;
  }
  return 0;
}

function execute(plan, datasets) {
  if (!plan) throw new Error('plannerExecutor: plan required');
  if (!datasets || typeof datasets !== 'object') {
    throw new Error('plannerExecutor: datasets required');
  }
  switch (plan.kind) {
    case PhysicalKind.SEQ_SCAN: {
      const ds = datasets[plan.source];
      if (!Array.isArray(ds)) {
        throw new Error(`plannerExecutor: dataset ${plan.source} not found`);
      }
      return ds.slice();
    }
    case PhysicalKind.FILTER: {
      const rows = execute(plan.input, datasets);
      return rows.filter((row) => evalExpr(plan.predicate, row));
    }
    case PhysicalKind.PROJECT: {
      const rows = execute(plan.input, datasets);
      return rows.map((r) => projectRow(r, plan.columns));
    }
    case PhysicalKind.SORT: {
      const rows = execute(plan.input, datasets);
      return rows.sort((a, b) => compareRows(a, b, plan.orderItems));
    }
    case PhysicalKind.LIMIT: {
      const rows = execute(plan.input, datasets);
      return rows.slice(0, plan.limit);
    }
    default:
      throw new Error(`plannerExecutor: unknown kind ${plan.kind}`);
  }
}

module.exports = { evalExpr, projectRow, compareRows, execute };
