'use strict';

const { validateDelta } = require('./deltaTypes');

class LedgerStore {
  constructor() {
    this._entries = [];
    this._nextSeq = 1;
  }

  append(delta, opts) {
    const v = validateDelta(delta);
    if (!v.ok) throw new Error('LedgerStore.append: ' + v.error);
    const entry = {
      seq: this._nextSeq++,
      ts: (opts && typeof opts.ts === 'number') ? opts.ts : Date.now(),
      delta: Object.assign({}, delta)
    };
    this._entries.push(entry);
    return entry;
  }

  size() { return this._entries.length; }

  range(fromSeq, toSeq) {
    return this._entries.filter((e) => e.seq >= fromSeq && (toSeq === undefined || e.seq <= toSeq));
  }

  forRecipe(recipeId) {
    return this._entries.filter((e) => e.delta.recipe_id === recipeId);
  }

  all() {
    return this._entries.slice();
  }

  truncate(beforeSeq) {
    const kept = this._entries.filter((e) => e.seq >= beforeSeq);
    const removed = this._entries.length - kept.length;
    this._entries = kept;
    return removed;
  }
}

module.exports = { LedgerStore };
