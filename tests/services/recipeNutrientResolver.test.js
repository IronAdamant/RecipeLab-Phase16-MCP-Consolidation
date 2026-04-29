'use strict';

const { test, equal, deepEqual, ok, throws } = require('../testRunner');

const {
  NutrientGraph,
  DynamicNutrientRegistry,
  ResolverChain,
  createDefaultResolver,
  resolveRecipeNutrients
} = require('../../src/services/recipeNutrientResolver');

test('NutrientGraph: addNode is idempotent', () => {
  const g = new NutrientGraph();
  g.addNode('carbs');
  g.addNode('carbs');
  equal(g.size(), 1);
});

test('NutrientGraph: addEdge implies addNode for both ends', () => {
  const g = new NutrientGraph();
  g.addEdge('carbs', 'fiber');
  ok(g.hasNode('carbs'));
  ok(g.hasNode('fiber'));
});

test('NutrientGraph: walk visits descendants once', () => {
  const g = new NutrientGraph();
  g.addEdge('a', 'b');
  g.addEdge('b', 'c');
  g.addEdge('a', 'c');
  const seen = [];
  g.walk('a', (n) => seen.push(n));
  equal(seen.length, 3);
  ok(seen.indexOf('a') >= 0);
  ok(seen.indexOf('b') >= 0);
  ok(seen.indexOf('c') >= 0);
});

test('NutrientGraph: walk on isolated node visits only that node', () => {
  const g = new NutrientGraph();
  g.addNode('lonely');
  const seen = [];
  g.walk('lonely', (n) => seen.push(n));
  deepEqual(seen, ['lonely']);
});

test('NutrientGraph: childrenOf default returns []', () => {
  const g = new NutrientGraph();
  deepEqual(g.childrenOf('missing'), []);
});

test('DynamicNutrientRegistry: register + has + get', () => {
  const r = new DynamicNutrientRegistry();
  r.register('iron', () => 42);
  ok(r.has('iron'));
  equal(r.get('iron')(), 42);
});

test('DynamicNutrientRegistry: register rejects bad name', () => {
  const r = new DynamicNutrientRegistry();
  throws(() => r.register('', () => 0), /name required/);
});

test('DynamicNutrientRegistry: register rejects non-function', () => {
  const r = new DynamicNutrientRegistry();
  throws(() => r.register('iron', 'not-a-function'), /resolver must be a function/);
});

test('DynamicNutrientRegistry: alias resolves transitively', () => {
  const r = new DynamicNutrientRegistry();
  r.register('canonical', () => 'C');
  r.alias('a', 'b');
  r.alias('b', 'canonical');
  equal(r.get('a')(), 'C');
});

test('DynamicNutrientRegistry: alias loop terminates', () => {
  const r = new DynamicNutrientRegistry();
  r.alias('a', 'b');
  r.alias('b', 'a');
  // Should not hang — return whatever the loop bottoms out at
  const name = r.resolveName('a');
  ok(name === 'a' || name === 'b');
});

test('DynamicNutrientRegistry: list sorts names', () => {
  const r = new DynamicNutrientRegistry();
  r.register('zinc', () => 1);
  r.register('iron', () => 2);
  r.register('calcium', () => 3);
  deepEqual(r.list(), ['calcium', 'iron', 'zinc']);
});

test('DynamicNutrientRegistry: unregister returns boolean', () => {
  const r = new DynamicNutrientRegistry();
  r.register('iron', () => 1);
  equal(r.unregister('iron'), true);
  equal(r.unregister('iron'), false);
});

test('ResolverChain: resolve walks and dispatches each node', () => {
  const chain = createDefaultResolver();
  const out = chain.resolve('fiber', { fiber: 5, soluble_fiber: 2, insoluble_fiber: 3 });
  equal(out.fiber, 5);
  equal(out.soluble_fiber, 2);
  equal(out.insoluble_fiber, 3);
});

test('ResolverChain: resolve uses fallback for unregistered', () => {
  const graph = new NutrientGraph();
  graph.addEdge('a', 'b');
  const registry = new DynamicNutrientRegistry();
  registry.register('a', () => 1);
  const chain = new ResolverChain({ graph, registry, fallback: () => 99 });
  const out = chain.resolve('a', {});
  equal(out.a, 1);
  equal(out.b, 99);
});

test('ResolverChain: resolveAll merges across seeds', () => {
  const chain = createDefaultResolver();
  const out = chain.resolveAll(['carbs', 'fat'], {
    carbs: 10, fiber: 4, soluble_fiber: 1, insoluble_fiber: 3,
    fat: 8, saturated_fat: 2, unsaturated_fat: 6
  });
  equal(out.carbs, 10);
  equal(out.fiber, 4);
  equal(out.fat, 8);
  equal(out.saturated_fat, 2);
  equal(out.unsaturated_fat, 6);
});

test('resolveRecipeNutrients: empty recipe yields zeros', () => {
  const out = resolveRecipeNutrients({});
  equal(out.carbs, 0);
  equal(out.fat, 0);
  equal(out.protein, 0);
});

test('resolveRecipeNutrients: pulls from recipe.nutrition', () => {
  const out = resolveRecipeNutrients({ nutrition: { carbs: 30, fat: 5, protein: 12 } });
  equal(out.carbs, 30);
  equal(out.fat, 5);
  equal(out.protein, 12);
});

test('resolveRecipeNutrients: alias total_fat resolves to fat', () => {
  const chain = createDefaultResolver();
  // direct registry lookup — exercises alias chain
  equal(chain.registry.has('total_fat'), true);
  equal(chain.registry.get('total_fat')({ fat: 7 }), 7);
});

test('resolveRecipeNutrients: custom seeds', () => {
  const out = resolveRecipeNutrients(
    { nutrition: { protein: 25, essential_amino_acids: 9 } },
    { seeds: ['protein'] }
  );
  equal(out.protein, 25);
  equal(out.essential_amino_acids, 9);
  equal(out.carbs, undefined);
});
