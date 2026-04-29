'use strict';

const { test, equal, deepEqual, ok, throws } = require('../testRunner');
const {
  TYPES, ALL, isValidType, validateDelta
} = require('../../src/services/recipeProvenanceLedger/deltaTypes');
const { LedgerStore } = require('../../src/services/recipeProvenanceLedger/ledgerStore');
const { DeltaCompactor } = require('../../src/services/recipeProvenanceLedger/deltaCompactor');
const { RecipeProvenanceLedger } = require('../../src/services/recipeProvenanceLedger');

// deltaTypes
test('deltaTypes: TYPES has 5 known kinds', () => {
  equal(ALL.length, 5);
  ok(TYPES.CREATE && TYPES.UPDATE && TYPES.DELETE && TYPES.RENAME && TYPES.MERGE);
});

test('deltaTypes.isValidType', () => {
  ok(isValidType('create'));
  ok(isValidType('rename'));
  ok(!isValidType('xxx'));
});

test('deltaTypes.validateDelta: requires object', () => {
  equal(validateDelta(null).ok, false);
  equal(validateDelta('str').ok, false);
});

test('deltaTypes.validateDelta: requires valid type', () => {
  const v = validateDelta({ type: 'xxx', recipe_id: 'r1' });
  equal(v.ok, false);
});

test('deltaTypes.validateDelta: requires recipe_id', () => {
  const v = validateDelta({ type: 'create', recipe_id: '' });
  equal(v.ok, false);
});

test('deltaTypes.validateDelta: rename requires from', () => {
  const bad = validateDelta({ type: 'rename', recipe_id: 'r2' });
  equal(bad.ok, false);
  const good = validateDelta({ type: 'rename', recipe_id: 'r2', from: 'r1' });
  equal(good.ok, true);
});

// LedgerStore
test('LedgerStore: append assigns seq', () => {
  const s = new LedgerStore();
  const e = s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  equal(e.seq, 1);
  equal(s.append({ type: 'update', recipe_id: 'r1', payload: { name: 'A2' } }).seq, 2);
});

test('LedgerStore: append rejects invalid', () => {
  const s = new LedgerStore();
  throws(() => s.append({ type: 'xx', recipe_id: 'r1' }), /invalid type/);
});

test('LedgerStore: range filters by seq', () => {
  const s = new LedgerStore();
  for (let i = 0; i < 5; i++) s.append({ type: 'create', recipe_id: 'r' + i });
  equal(s.range(2, 4).length, 3);
});

test('LedgerStore: forRecipe filters', () => {
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1' });
  s.append({ type: 'create', recipe_id: 'r2' });
  s.append({ type: 'update', recipe_id: 'r1', payload: {} });
  equal(s.forRecipe('r1').length, 2);
  equal(s.forRecipe('r2').length, 1);
});

test('LedgerStore: truncate removes prior entries', () => {
  const s = new LedgerStore();
  for (let i = 0; i < 5; i++) s.append({ type: 'create', recipe_id: 'r' + i });
  const removed = s.truncate(3);
  equal(removed, 2);
  equal(s.size(), 3);
});

// DeltaCompactor
test('DeltaCompactor: shouldSnapshot at interval', () => {
  const c = new DeltaCompactor({ intervalEntries: 3 });
  const s = new LedgerStore();
  ok(!c.shouldSnapshot(s));
  s.append({ type: 'create', recipe_id: 'r1' });
  ok(!c.shouldSnapshot(s));
  s.append({ type: 'create', recipe_id: 'r2' });
  s.append({ type: 'create', recipe_id: 'r3' });
  ok(c.shouldSnapshot(s));
});

test('DeltaCompactor: snapshot folds state', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  s.append({ type: 'update', recipe_id: 'r1', payload: { calories: 500 } });
  const snap = c.snapshot(s);
  ok(snap !== null);
  equal(snap.seq, 2);
  equal(snap.state.r1.name, 'A');
  equal(snap.state.r1.calories, 500);
});

test('DeltaCompactor: snapshot empty store returns null', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  equal(c.snapshot(s), null);
});

test('DeltaCompactor: replay from snapshot', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  s.append({ type: 'create', recipe_id: 'r2', payload: { name: 'B' } });
  const snap = c.snapshot(s);
  s.append({ type: 'update', recipe_id: 'r1', payload: { name: 'A2' } });
  const state = c.replay(s, snap);
  equal(state.r1.name, 'A2');
  equal(state.r2.name, 'B');
});

test('DeltaCompactor: replay from start (no snapshot)', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  const state = c.replay(s, null);
  equal(state.r1.name, 'A');
});

test('DeltaCompactor: handles delete', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  s.append({ type: 'delete', recipe_id: 'r1' });
  const state = c.replay(s, null);
  ok(!state.r1);
});

test('DeltaCompactor: handles rename', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  s.append({ type: 'rename', recipe_id: 'r2', from: 'r1' });
  const state = c.replay(s, null);
  ok(!state.r1);
  equal(state.r2.name, 'A');
  equal(state.r2._id, 'r2');
});

test('DeltaCompactor: handles merge', () => {
  const c = new DeltaCompactor();
  const s = new LedgerStore();
  s.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A', kcal: 100 } });
  s.append({ type: 'create', recipe_id: 'r2', payload: { name: 'B', protein: 30 } });
  s.append({ type: 'merge', recipe_id: 'r2', from: 'r1' });
  const state = c.replay(s, null);
  ok(!state.r1);
  equal(state.r2._id, 'r2');
  // r1's name overwrites because src spreads after dst
  equal(state.r2.name, 'A');
  equal(state.r2.kcal, 100);
  equal(state.r2.protein, 30);
});

// Facade
test('RecipeProvenanceLedger: append + history', () => {
  const l = new RecipeProvenanceLedger();
  l.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  l.append({ type: 'update', recipe_id: 'r1', payload: { name: 'A2' } });
  equal(l.history('r1').length, 2);
});

test('RecipeProvenanceLedger: state reflects entries', () => {
  const l = new RecipeProvenanceLedger();
  l.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  equal(l.state().r1.name, 'A');
});

test('RecipeProvenanceLedger: auto-snapshot at interval', () => {
  const l = new RecipeProvenanceLedger({ intervalEntries: 2 });
  l.append({ type: 'create', recipe_id: 'r1' });
  equal(l.snapshots().length, 0);
  l.append({ type: 'create', recipe_id: 'r2' });
  equal(l.snapshots().length, 1);
});

test('RecipeProvenanceLedger: forceSnapshot', () => {
  const l = new RecipeProvenanceLedger({ intervalEntries: 999 });
  l.append({ type: 'create', recipe_id: 'r1' });
  const s = l.forceSnapshot();
  ok(s !== null);
  equal(l.snapshots().length, 1);
});

test('RecipeProvenanceLedger: truncateBefore', () => {
  const l = new RecipeProvenanceLedger();
  for (let i = 0; i < 5; i++) l.append({ type: 'create', recipe_id: 'r' + i });
  const r = l.truncateBefore(3);
  equal(r, 2);
  equal(l.size(), 3);
});

test('RecipeProvenanceLedger: replay after multiple snapshots', () => {
  const l = new RecipeProvenanceLedger({ intervalEntries: 2 });
  l.append({ type: 'create', recipe_id: 'r1', payload: { name: 'A' } });
  l.append({ type: 'create', recipe_id: 'r2', payload: { name: 'B' } });
  l.append({ type: 'update', recipe_id: 'r1', payload: { name: 'A2' } });
  l.append({ type: 'create', recipe_id: 'r3', payload: { name: 'C' } });
  const state = l.state();
  equal(state.r1.name, 'A2');
  equal(state.r2.name, 'B');
  equal(state.r3.name, 'C');
});
