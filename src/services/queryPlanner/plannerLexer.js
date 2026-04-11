'use strict';

const { TokenKind, KEYWORDS, makeToken } = require('./plannerTokens');

function isAlpha(ch) {
  return /[A-Za-z_]/.test(ch);
}
function isAlnum(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}
function isDigit(ch) {
  return /[0-9]/.test(ch);
}

function tokenize(source) {
  if (typeof source !== 'string') {
    throw new Error('plannerLexer.tokenize: source must be a string');
  }
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }

    if (ch === '*') { tokens.push(makeToken(TokenKind.STAR, '*', i)); i++; continue; }
    if (ch === ',') { tokens.push(makeToken(TokenKind.COMMA, ',', i)); i++; continue; }
    if (ch === '(') { tokens.push(makeToken(TokenKind.LPAREN, '(', i)); i++; continue; }
    if (ch === ')') { tokens.push(makeToken(TokenKind.RPAREN, ')', i)); i++; continue; }

    if (ch === '=') { tokens.push(makeToken(TokenKind.EQ, '=', i)); i++; continue; }
    if (ch === '!' && source[i + 1] === '=') {
      tokens.push(makeToken(TokenKind.NEQ, '!=', i)); i += 2; continue;
    }
    if (ch === '<' && source[i + 1] === '=') {
      tokens.push(makeToken(TokenKind.LTE, '<=', i)); i += 2; continue;
    }
    if (ch === '>' && source[i + 1] === '=') {
      tokens.push(makeToken(TokenKind.GTE, '>=', i)); i += 2; continue;
    }
    if (ch === '<') { tokens.push(makeToken(TokenKind.LT, '<', i)); i++; continue; }
    if (ch === '>') { tokens.push(makeToken(TokenKind.GT, '>', i)); i++; continue; }

    if (ch === '\'' || ch === '"') {
      const quote = ch;
      const start = i;
      i++;
      let value = '';
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\' && i + 1 < source.length) {
          value += source[i + 1];
          i += 2;
        } else {
          value += source[i];
          i++;
        }
      }
      if (i >= source.length) {
        throw new Error(`plannerLexer: unterminated string at ${start}`);
      }
      i++;
      tokens.push(makeToken(TokenKind.STRING, value, start));
      continue;
    }

    if (isDigit(ch)) {
      const start = i;
      while (i < source.length && (isDigit(source[i]) || source[i] === '.')) i++;
      tokens.push(makeToken(TokenKind.NUMBER, parseFloat(source.slice(start, i)), start));
      continue;
    }

    if (isAlpha(ch)) {
      const start = i;
      while (i < source.length && isAlnum(source[i])) i++;
      const word = source.slice(start, i);
      const lower = word.toLowerCase();
      if (KEYWORDS[lower]) {
        tokens.push(makeToken(KEYWORDS[lower], lower, start));
      } else {
        tokens.push(makeToken(TokenKind.IDENT, word, start));
      }
      continue;
    }

    throw new Error(`plannerLexer: unexpected character '${ch}' at ${i}`);
  }
  tokens.push(makeToken(TokenKind.EOF, null, i));
  return tokens;
}

module.exports = { tokenize };
