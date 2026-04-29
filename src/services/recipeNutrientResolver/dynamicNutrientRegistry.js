'use strict';

// DynamicNutrientRegistry — late-bound resolver registry.
// Resolvers are registered by name at runtime, not import time. This stresses
// MCP symbol indices that rely on static analysis (Chisel/Stele) — the symbol
// "vitaminD_resolver" only exists after register() is called.

class DynamicNutrientRegistry {
  constructor() {
    this._resolvers = new Map();
    this._aliases = new Map();
  }

  register(name, resolver) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('register: name required');
    }
    if (typeof resolver !== 'function') {
      throw new Error('register: resolver must be a function');
    }
    this._resolvers.set(name, resolver);
    return this;
  }

  alias(from, to) {
    this._aliases.set(from, to);
    return this;
  }

  resolveName(name) {
    let cur = name;
    let hops = 0;
    while (this._aliases.has(cur) && hops < 16) {
      cur = this._aliases.get(cur);
      hops += 1;
    }
    return cur;
  }

  has(name) {
    return this._resolvers.has(this.resolveName(name));
  }

  get(name) {
    return this._resolvers.get(this.resolveName(name)) || null;
  }

  list() {
    return Array.from(this._resolvers.keys()).sort();
  }

  unregister(name) {
    return this._resolvers.delete(name);
  }
}

module.exports = { DynamicNutrientRegistry };
