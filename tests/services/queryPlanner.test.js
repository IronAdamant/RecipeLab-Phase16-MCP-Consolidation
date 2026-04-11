'use strict';

const { describe, test, assert } = require('../testRunner');
const planner = require('../../src/services/queryPlanner');
const lexer = require('../../src/services/queryPlanner/plannerLexer');
const parser = require('../../src/services/queryPlanner/plannerParser');
const logical = require('../../src/services/queryPlanner/plannerLogicalPlan');
const physical = require('../../src/services/queryPlanner/plannerPhysicalPlan');
const { TokenKind } = require('../../src/services/queryPlanner/plannerTokens');

const DATASET = {
  recipes: [
    { id: 1, name: 'Soup', calories: 250, servings: 4, category: 'starter' },
    { id: 2, name: 'Salad', calories: 150, servings: 2, category: 'starter' },
    { id: 3, name: 'Bread', calories: 500, servings: 8, category: 'side' },
    { id: 4, name: 'Cake', calories: 700, servings: 10, category: 'dessert' },
    { id: 5, name: 'Pasta', calories: 450, servings: 4, category: 'main' }
  ]
};

describe('queryPlanner.lexer', () => {
  test('tokenizes keywords', () => {
    const tokens = lexer.tokenize('SELECT * FROM recipes');
    assert.strictEqual(tokens[0].kind, TokenKind.SELECT);
    assert.strictEqual(tokens[1].kind, TokenKind.STAR);
    assert.strictEqual(tokens[2].kind, TokenKind.FROM);
  });

  test('tokenizes operators', () => {
    const tokens = lexer.tokenize('a >= 10');
    assert.strictEqual(tokens[1].kind, TokenKind.GTE);
  });

  test('tokenizes strings', () => {
    const tokens = lexer.tokenize("'hello'");
    assert.strictEqual(tokens[0].value, 'hello');
  });

  test('throws on unterminated string', () => {
    assert.throws(() => lexer.tokenize("'abc"));
  });
});

describe('queryPlanner.parser', () => {
  test('parses SELECT *', () => {
    const ast = parser.parse('SELECT * FROM recipes');
    assert.strictEqual(ast.source, 'recipes');
    assert.strictEqual(ast.columns[0].kind, 'Star');
  });

  test('parses WHERE clause', () => {
    const ast = parser.parse("SELECT name FROM recipes WHERE calories > 200");
    assert.strictEqual(ast.where.op, '>');
  });

  test('parses ORDER BY DESC', () => {
    const ast = parser.parse("SELECT * FROM recipes ORDER BY calories DESC");
    assert.strictEqual(ast.orderBy[0].direction, 'desc');
  });

  test('parses LIMIT', () => {
    const ast = parser.parse("SELECT * FROM recipes LIMIT 3");
    assert.strictEqual(ast.limit, 3);
  });

  test('parses AND/OR', () => {
    const ast = parser.parse("SELECT * FROM recipes WHERE calories > 100 AND servings < 5");
    assert.strictEqual(ast.where.op, 'AND');
  });
});

describe('queryPlanner.logical', () => {
  test('builds Scan+Project for bare SELECT', () => {
    const ast = parser.parse('SELECT * FROM recipes');
    const plan = logical.fromAST(ast);
    assert.strictEqual(plan.kind, 'LogicalProject');
    assert.strictEqual(plan.input.kind, 'LogicalScan');
  });

  test('adds Filter when WHERE present', () => {
    const ast = parser.parse('SELECT * FROM recipes WHERE id = 1');
    const plan = logical.fromAST(ast);
    assert.strictEqual(plan.input.kind, 'LogicalFilter');
  });
});

describe('queryPlanner.physical', () => {
  test('lower produces physical plan', () => {
    const ast = parser.parse('SELECT * FROM recipes');
    const lp = logical.fromAST(ast);
    const pp = physical.lower(lp);
    assert.strictEqual(pp.kind, 'PhysicalProject');
    assert.strictEqual(pp.input.kind, 'PhysicalSeqScan');
  });
});

describe('queryPlanner.executor', () => {
  test('SELECT * FROM recipes returns all rows', () => {
    const results = planner.query('SELECT * FROM recipes', DATASET);
    assert.strictEqual(results.length, 5);
  });

  test('WHERE filters rows', () => {
    const results = planner.query('SELECT * FROM recipes WHERE calories > 400', DATASET);
    assert.strictEqual(results.length, 3);
  });

  test('projects specific columns', () => {
    const results = planner.query('SELECT name, calories FROM recipes', DATASET);
    assert.deepStrictEqual(Object.keys(results[0]).sort(), ['calories', 'name']);
  });

  test('ORDER BY calories DESC', () => {
    const results = planner.query('SELECT * FROM recipes ORDER BY calories DESC', DATASET);
    assert.strictEqual(results[0].calories, 700);
    assert.strictEqual(results[4].calories, 150);
  });

  test('LIMIT truncates result', () => {
    const results = planner.query('SELECT * FROM recipes LIMIT 2', DATASET);
    assert.strictEqual(results.length, 2);
  });

  test('combined WHERE + ORDER + LIMIT', () => {
    const results = planner.query(
      "SELECT name FROM recipes WHERE calories >= 250 ORDER BY calories ASC LIMIT 2",
      DATASET
    );
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].name, 'Soup');
  });

  test("WHERE with string equality", () => {
    const results = planner.query(
      "SELECT * FROM recipes WHERE category = 'starter'",
      DATASET
    );
    assert.strictEqual(results.length, 2);
  });

  test('WHERE AND', () => {
    const results = planner.query(
      'SELECT * FROM recipes WHERE calories > 200 AND servings >= 4',
      DATASET
    );
    assert.strictEqual(results.length, 4);
  });

  test('explain returns full plan tree', () => {
    const plan = planner.explain('SELECT name FROM recipes WHERE id = 1');
    assert.ok(plan.ast);
    assert.ok(plan.logical);
    assert.ok(plan.physical);
  });

  test('throws on unknown dataset', () => {
    assert.throws(() => planner.query('SELECT * FROM nonexistent', DATASET));
  });
});
