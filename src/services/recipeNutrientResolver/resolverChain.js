'use strict';

// ResolverChain — walks the nutrient graph, dispatching each visited node
// through the DynamicNutrientRegistry. Polymorphic dispatch by name.

const { NutrientGraph } = require('./nutrientGraph');
const { DynamicNutrientRegistry } = require('./dynamicNutrientRegistry');

class ResolverChain {
  constructor(opts) {
    const o = opts || {};
    this.graph = o.graph instanceof NutrientGraph ? o.graph : new NutrientGraph();
    this.registry = o.registry instanceof DynamicNutrientRegistry ? o.registry : new DynamicNutrientRegistry();
    this._fallback = typeof o.fallback === 'function' ? o.fallback : null;
  }

  resolve(name, context) {
    const out = {};
    this.graph.walk(name, (node) => {
      const fn = this.registry.get(node);
      if (fn) {
        out[node] = fn(context || {});
      } else if (this._fallback) {
        out[node] = this._fallback(node, context || {});
      } else {
        out[node] = null;
      }
    });
    return out;
  }

  resolveAll(names, context) {
    const o = {};
    for (const n of names) Object.assign(o, this.resolve(n, context));
    return o;
  }
}

module.exports = { ResolverChain };
