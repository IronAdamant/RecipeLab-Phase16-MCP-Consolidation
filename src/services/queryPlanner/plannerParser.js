'use strict';

const { tokenize } = require('./plannerLexer');
const { TokenKind } = require('./plannerTokens');
const {
  SelectStatement,
  ColumnRef,
  Literal,
  BinaryExpr,
  Star,
  OrderItem
} = require('./plannerAST');

function parse(source) {
  const tokens = tokenize(source);
  let pos = 0;

  function peek() { return tokens[pos]; }
  function advance() { return tokens[pos++]; }
  function expect(kind) {
    const tok = advance();
    if (tok.kind !== kind) {
      throw new Error(`plannerParser: expected ${kind}, got ${tok.kind} at ${tok.pos}`);
    }
    return tok;
  }
  function accept(kind) {
    if (peek().kind === kind) return advance();
    return null;
  }

  function parseColumns() {
    if (accept(TokenKind.STAR)) return [Star()];
    const cols = [];
    cols.push(ColumnRef(expect(TokenKind.IDENT).value));
    while (accept(TokenKind.COMMA)) {
      cols.push(ColumnRef(expect(TokenKind.IDENT).value));
    }
    return cols;
  }

  function parseValue() {
    const tok = peek();
    if (tok.kind === TokenKind.NUMBER) { advance(); return Literal(tok.value); }
    if (tok.kind === TokenKind.STRING) { advance(); return Literal(tok.value); }
    if (tok.kind === TokenKind.IDENT) { advance(); return ColumnRef(tok.value); }
    throw new Error(`plannerParser: expected value at ${tok.pos}`);
  }

  function parseComparison() {
    const left = parseValue();
    const op = peek();
    const opMap = {
      [TokenKind.EQ]: '=',
      [TokenKind.NEQ]: '!=',
      [TokenKind.LT]: '<',
      [TokenKind.GT]: '>',
      [TokenKind.LTE]: '<=',
      [TokenKind.GTE]: '>='
    };
    if (opMap[op.kind]) {
      advance();
      return BinaryExpr(opMap[op.kind], left, parseValue());
    }
    return left;
  }

  function parseAnd() {
    let left = parseComparison();
    while (accept(TokenKind.AND)) {
      left = BinaryExpr('AND', left, parseComparison());
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (accept(TokenKind.OR)) {
      left = BinaryExpr('OR', left, parseAnd());
    }
    return left;
  }

  function parseOrderBy() {
    const items = [];
    const first = expect(TokenKind.IDENT);
    let dir = 'asc';
    if (accept(TokenKind.ASC)) dir = 'asc';
    else if (accept(TokenKind.DESC)) dir = 'desc';
    items.push(OrderItem(first.value, dir));
    while (accept(TokenKind.COMMA)) {
      const tok = expect(TokenKind.IDENT);
      let d = 'asc';
      if (accept(TokenKind.ASC)) d = 'asc';
      else if (accept(TokenKind.DESC)) d = 'desc';
      items.push(OrderItem(tok.value, d));
    }
    return items;
  }

  expect(TokenKind.SELECT);
  const columns = parseColumns();
  expect(TokenKind.FROM);
  const source_ = expect(TokenKind.IDENT).value;
  let where = null;
  let orderBy = [];
  let limit = null;
  if (accept(TokenKind.WHERE)) where = parseOr();
  if (accept(TokenKind.ORDER)) {
    expect(TokenKind.BY);
    orderBy = parseOrderBy();
  }
  if (accept(TokenKind.LIMIT)) {
    limit = expect(TokenKind.NUMBER).value;
  }
  expect(TokenKind.EOF);

  return SelectStatement(columns, source_, where, orderBy, limit);
}

module.exports = { parse };
