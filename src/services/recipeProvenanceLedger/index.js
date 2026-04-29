'use strict';

const { TYPES, validateDelta } = require('./deltaTypes');
const { LedgerStore }          = require('./ledgerStore');
const { DeltaCompactor }       = require('./deltaCompactor');

class RecipeProvenanceLedger {
  constructor(opts) {
    this._store = new LedgerStore();
    this._compactor = new DeltaCompactor(opts || {});
  }

  append(delta, opts) {
    const entry = this._store.append(delta, opts);
    if (this._compactor.shouldSnapshot(this._store)) {
      this._compactor.snapshot(this._store);
    }
    return entry;
  }

  history(recipeId) {
    return this._store.forRecipe(recipeId);
  }

  state() {
    const snap = this._compactor.latestSnapshot();
    return this._compactor.replay(this._store, snap);
  }

  size() { return this._store.size(); }

  snapshots() { return this._compactor._snapshots.slice(); }

  forceSnapshot() { return this._compactor.snapshot(this._store); }

  truncateBefore(seq) { return this._store.truncate(seq); }
}

module.exports = {
  RecipeProvenanceLedger,
  LedgerStore,
  DeltaCompactor,
  TYPES,
  validateDelta
};
