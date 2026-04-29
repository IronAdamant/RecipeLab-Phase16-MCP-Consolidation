'use strict';

// NutrientGraph — adjacency-list graph of nutrient → child nutrients.
// Used by ResolverChain to traverse derivations (e.g. carbs → fiber → soluble_fiber).

class NutrientGraph {
  constructor() {
    this._edges = new Map();
    this._nodes = new Map();
  }

  addNode(name, meta) {
    if (!this._nodes.has(name)) this._nodes.set(name, meta || {});
  }

  addEdge(parent, child, weight) {
    this.addNode(parent);
    this.addNode(child);
    if (!this._edges.has(parent)) this._edges.set(parent, []);
    this._edges.get(parent).push({ to: child, weight: typeof weight === 'number' ? weight : 1 });
  }

  childrenOf(name) {
    return this._edges.get(name) || [];
  }

  hasNode(name) {
    return this._nodes.has(name);
  }

  walk(start, visit) {
    const seen = new Set();
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop();
      if (seen.has(cur)) continue;
      seen.add(cur);
      visit(cur);
      for (const e of this.childrenOf(cur)) stack.push(e.to);
    }
  }

  size() { return this._nodes.size; }
}

module.exports = { NutrientGraph };
