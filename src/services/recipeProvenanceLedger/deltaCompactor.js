'use strict';

const { LedgerStore } = require('./ledgerStore');

// DeltaCompactor — snapshots ledger state at intervals; can replay from snapshot.

class DeltaCompactor {
  constructor(opts) {
    const o = opts || {};
    this._intervalEntries = typeof o.intervalEntries === 'number' && o.intervalEntries > 0
      ? o.intervalEntries : 100;
    this._snapshots = [];
  }

  shouldSnapshot(store) {
    if (!(store instanceof LedgerStore)) return false;
    return store.size() > 0 && store.size() % this._intervalEntries === 0;
  }

  snapshot(store) {
    if (!(store instanceof LedgerStore)) {
      throw new Error('snapshot: store must be LedgerStore');
    }
    const all = store.all();
    if (all.length === 0) return null;
    const lastSeq = all[all.length - 1].seq;
    const state = this._foldState(all);
    const snap = { seq: lastSeq, state, ts: Date.now() };
    this._snapshots.push(snap);
    return snap;
  }

  replay(store, fromSnapshot) {
    if (!(store instanceof LedgerStore)) {
      throw new Error('replay: store must be LedgerStore');
    }
    const startSeq = fromSnapshot && typeof fromSnapshot.seq === 'number' ? fromSnapshot.seq + 1 : 1;
    const tail = store.range(startSeq);
    const init = fromSnapshot && fromSnapshot.state ? cloneState(fromSnapshot.state) : {};
    return this._foldState(tail, init);
  }

  latestSnapshot() {
    return this._snapshots.length ? this._snapshots[this._snapshots.length - 1] : null;
  }

  _foldState(entries, init) {
    const state = init ? cloneState(init) : {};
    for (const e of entries) {
      const d = e.delta;
      if (d.type === 'create')      state[d.recipe_id] = Object.assign({}, d.payload || {}, { _id: d.recipe_id });
      else if (d.type === 'update') state[d.recipe_id] = Object.assign({}, state[d.recipe_id] || {}, d.payload || {});
      else if (d.type === 'delete') delete state[d.recipe_id];
      else if (d.type === 'rename') {
        if (state[d.from]) {
          state[d.recipe_id] = Object.assign({}, state[d.from], { _id: d.recipe_id });
          delete state[d.from];
        }
      } else if (d.type === 'merge') {
        const src = state[d.from] || {};
        const dst = state[d.recipe_id] || {};
        state[d.recipe_id] = Object.assign({}, dst, src, { _id: d.recipe_id });
        delete state[d.from];
      }
    }
    return state;
  }
}

function cloneState(state) {
  const out = {};
  for (const k of Object.keys(state)) out[k] = Object.assign({}, state[k]);
  return out;
}

module.exports = { DeltaCompactor };
