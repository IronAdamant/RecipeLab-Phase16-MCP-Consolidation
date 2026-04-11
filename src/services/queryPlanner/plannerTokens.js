'use strict';

const TokenKind = Object.freeze({
  SELECT: 'SELECT',
  FROM: 'FROM',
  WHERE: 'WHERE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  ORDER: 'ORDER',
  BY: 'BY',
  ASC: 'ASC',
  DESC: 'DESC',
  LIMIT: 'LIMIT',
  STAR: 'STAR',
  COMMA: 'COMMA',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  IDENT: 'IDENT',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  EOF: 'EOF'
});

const KEYWORDS = {
  select: TokenKind.SELECT,
  from: TokenKind.FROM,
  where: TokenKind.WHERE,
  and: TokenKind.AND,
  or: TokenKind.OR,
  not: TokenKind.NOT,
  order: TokenKind.ORDER,
  by: TokenKind.BY,
  asc: TokenKind.ASC,
  desc: TokenKind.DESC,
  limit: TokenKind.LIMIT
};

function makeToken(kind, value, pos) {
  return { kind, value, pos };
}

module.exports = { TokenKind, KEYWORDS, makeToken };
