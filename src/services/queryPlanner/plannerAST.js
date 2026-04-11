'use strict';

const NodeKind = Object.freeze({
  SELECT_STMT: 'SelectStatement',
  COLUMN_REF: 'ColumnRef',
  LITERAL: 'Literal',
  BINARY_EXPR: 'BinaryExpr',
  STAR: 'Star',
  ORDER_ITEM: 'OrderItem'
});

function SelectStatement(columns, source, where, orderBy, limit) {
  return {
    kind: NodeKind.SELECT_STMT,
    columns,
    source,
    where: where || null,
    orderBy: orderBy || [],
    limit: limit != null ? limit : null
  };
}

function ColumnRef(name) {
  return { kind: NodeKind.COLUMN_REF, name };
}

function Literal(value) {
  return { kind: NodeKind.LITERAL, value };
}

function BinaryExpr(op, left, right) {
  return { kind: NodeKind.BINARY_EXPR, op, left, right };
}

function Star() {
  return { kind: NodeKind.STAR };
}

function OrderItem(column, direction) {
  return { kind: NodeKind.ORDER_ITEM, column, direction: direction || 'asc' };
}

module.exports = {
  NodeKind,
  SelectStatement,
  ColumnRef,
  Literal,
  BinaryExpr,
  Star,
  OrderItem
};
