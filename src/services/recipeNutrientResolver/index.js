'use strict';

// recipeNutrientResolver — facade that wires graph+registry+chain.
// Polymorphic dispatch lives here: createDefaultResolver builds a chain with
// names that overlap nutrient-data names defined elsewhere in the project.

const { NutrientGraph } = require('./nutrientGraph');
const { DynamicNutrientRegistry } = require('./dynamicNutrientRegistry');
const { ResolverChain } = require('./resolverChain');

function createDefaultResolver() {
  const graph = new NutrientGraph();
  graph.addEdge('carbs', 'fiber');
  graph.addEdge('fiber', 'soluble_fiber');
  graph.addEdge('fiber', 'insoluble_fiber');
  graph.addEdge('fat', 'saturated_fat');
  graph.addEdge('fat', 'unsaturated_fat');
  graph.addEdge('protein', 'essential_amino_acids');

  const registry = new DynamicNutrientRegistry();
  registry.register('carbs', (ctx) => Number(ctx.carbs || 0));
  registry.register('fiber', (ctx) => Number(ctx.fiber || 0));
  registry.register('soluble_fiber', (ctx) => Number(ctx.soluble_fiber || 0));
  registry.register('insoluble_fiber', (ctx) => Number(ctx.insoluble_fiber || 0));
  registry.register('fat', (ctx) => Number(ctx.fat || 0));
  registry.register('saturated_fat', (ctx) => Number(ctx.saturated_fat || 0));
  registry.register('unsaturated_fat', (ctx) => Number(ctx.unsaturated_fat || 0));
  registry.register('protein', (ctx) => Number(ctx.protein || 0));
  registry.register('essential_amino_acids', (ctx) => Number(ctx.essential_amino_acids || 0));
  registry.alias('total_fat', 'fat');

  return new ResolverChain({ graph, registry, fallback: () => 0 });
}

function resolveRecipeNutrients(recipe, opts) {
  const o = opts || {};
  const chain = o.chain instanceof ResolverChain ? o.chain : createDefaultResolver();
  const seeds = Array.isArray(o.seeds) && o.seeds.length ? o.seeds : ['carbs', 'fat', 'protein'];
  const ctx = recipe && recipe.nutrition ? recipe.nutrition : {};
  return chain.resolveAll(seeds, ctx);
}

module.exports = {
  NutrientGraph,
  DynamicNutrientRegistry,
  ResolverChain,
  createDefaultResolver,
  resolveRecipeNutrients
};
