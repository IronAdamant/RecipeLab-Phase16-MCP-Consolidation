'use strict';

const path = require('path');
const { mountPrefix, mergeRouters } = require('../utils/router');

/**
 * Load and register all API routes onto the given router.
 *
 * @param {Router} apiRouter - The main API router instance
 * @param {Object} helpers
 * @param {Function} helpers.getDb   - Returns the database instance
 * @param {Function} helpers.withDb  - Middleware: attaches db to req
 * @param {Function} helpers.withJson - Middleware: parses JSON body
 * @param {Function} helpers.m       - Shorthand for withDb(mountPrefix(prefix, router))
 */
function loadRoutes(apiRouter, { getDb, withDb, withJson, m }) {
  const { json } = require('../utils/response');

  // ---------------------------------------------------------------
  // Core CRUD routers (prefix-mounted)
  // ---------------------------------------------------------------
  const recipesRouter = require('./routes/recipes');
  const ingredientsRouter = require('./routes/ingredients');
  const tagsRouter = require('./routes/tags');
  const mealPlansRouter = require('./routes/mealPlans');
  const shoppingListsRouter = require('./routes/shoppingLists');
  const collectionsRouter = require('./routes/collections');
  const dietaryProfilesRouter = require('./routes/dietaryProfiles');
  const cookingLogsRouter = require('./routes/cookingLogs');

  // ---------------------------------------------------------------
  // Service routers (prefix-mounted)
  // ---------------------------------------------------------------
  const searchRouter = require('./routes/search');
  const mealPlannerRouter = require('./routes/mealPlannerRoutes');
  const shoppingListServiceRouter = require('./routes/shoppingListServiceRoutes');
  const nutritionRouter = require('./routes/nutritionRoutes');
  const recommendationRouter = require('./routes/recommendationRoutes');
  const costRouter = require('./routes/costRoutes');
  const dietaryRouter = require('./routes/dietaryRoutes');
  const conversionRouter = require('./routes/conversionRoutes');
  const scalingRouter = require('./routes/scalingRoutes');
  const similarityRouter = require('./routes/similarityRoutes');
  const metricsRouter = require('./routes/metricsRoutes');
  const optimizerRouter = require('./routes/optimizerRoutes');
  const substitutionRouter = require('./routes/substitutionRoutes');

  // ---------------------------------------------------------------
  // Factory routers (instantiated with getDb() or project root)
  // ---------------------------------------------------------------
  const workflowRouterFactory = require('./routes/workflowRoutes');
  const relationshipRouterFactory = require('./routes/relationshipRoutes');
  const couplingRouterFactory = require('./routes/couplingRoutes');
  const semanticQueryRoutesFactory = require('./routes/semanticQueryRoutes');
  const coverageRoutesFactory = require('./routes/coverageRoutes');
  const scaffoldRoutesFactory = require('./routes/scaffoldRoutes');
  const hotSwapRoutesFactory = require('./routes/hotSwapRoutes');
  const reviewRoutesFactory = require('./routes/reviewRoutes');
  const registerMcpChallengeRoutes = require('./routes/mcpChallengeRoutes');
  const createVcsRoutes = require('./routes/vcsRoutes');
  const dynamicRequireRoutesFactory = require('./routes/dynamicRequireRoutes');
  const polymorphicSymbolRoutesFactory = require('./routes/polymorphicSymbolRoutes');
  const implicitDependencyRoutesFactory = require('./routes/implicitDependencyRoutes');
  const mutationRoutesFactory = require('./routes/mutationRoutes');
  const queryDecompositionRoutesFactory = require('./routes/queryDecompositionRoutes');

  const projectRoot = path.join(__dirname, '../..');

  const workflowRouter = workflowRouterFactory(getDb());
  const relationshipRouter = relationshipRouterFactory(getDb());
  const couplingRouter = couplingRouterFactory();
  const semanticQueryRouter = semanticQueryRoutesFactory(projectRoot);
  const coverageRouter = coverageRoutesFactory(projectRoot);
  const scaffoldRouter = scaffoldRoutesFactory();
  const hotSwapRouter = hotSwapRoutesFactory();
  const reviewRouter = reviewRoutesFactory(projectRoot);
  const dynamicRequireRouter = dynamicRequireRoutesFactory(projectRoot);
  const polymorphicSymbolRouter = polymorphicSymbolRoutesFactory();
  const implicitDependencyRouter = implicitDependencyRoutesFactory();
  const mutationRouter = mutationRoutesFactory();
  const queryDecompositionRouter = queryDecompositionRoutesFactory();

  registerMcpChallengeRoutes(apiRouter, projectRoot);

  // ---------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------
  apiRouter.get('/health', (req, res) => {
    json(res, { status: 'ok', timestamp: new Date().toISOString() });
  });

  // ---------------------------------------------------------------
  // Core CRUD routes
  // ---------------------------------------------------------------

  // Recipes
  apiRouter.get('/recipes', m('/recipes', recipesRouter));
  apiRouter.get('/recipes/:id', m('/recipes', recipesRouter));
  apiRouter.post('/recipes', withDb(withJson(mountPrefix('/recipes', recipesRouter))));
  apiRouter.put('/recipes/:id', withDb(withJson(mountPrefix('/recipes', recipesRouter))));
  apiRouter.delete('/recipes/:id', m('/recipes', recipesRouter));

  // Ingredients
  apiRouter.get('/ingredients', m('/ingredients', ingredientsRouter));
  apiRouter.get('/ingredients/:id', m('/ingredients', ingredientsRouter));
  apiRouter.post('/ingredients', withDb(withJson(mountPrefix('/ingredients', ingredientsRouter))));
  apiRouter.put('/ingredients/:id', withDb(withJson(mountPrefix('/ingredients', ingredientsRouter))));
  apiRouter.delete('/ingredients/:id', m('/ingredients', ingredientsRouter));

  // Tags
  apiRouter.get('/tags', m('/tags', tagsRouter));
  apiRouter.get('/tags/:id', m('/tags', tagsRouter));
  apiRouter.post('/tags', withDb(withJson(mountPrefix('/tags', tagsRouter))));
  apiRouter.put('/tags/:id', withDb(withJson(mountPrefix('/tags', tagsRouter))));
  apiRouter.delete('/tags/:id', m('/tags', tagsRouter));

  // Meal Plans
  apiRouter.get('/meal-plans', m('/meal-plans', mealPlansRouter));
  apiRouter.get('/meal-plans/:id', m('/meal-plans', mealPlansRouter));
  apiRouter.post('/meal-plans', withDb(withJson(mountPrefix('/meal-plans', mealPlansRouter))));
  apiRouter.put('/meal-plans/:id', withDb(withJson(mountPrefix('/meal-plans', mealPlansRouter))));
  apiRouter.delete('/meal-plans/:id', m('/meal-plans', mealPlansRouter));
  apiRouter.post('/meal-plans/:id/entries', withDb(withJson(mountPrefix('/meal-plans', mealPlansRouter))));
  apiRouter.delete('/meal-plans/:id/entries/:entryId', m('/meal-plans', mealPlansRouter));

  // Shopping Lists
  apiRouter.get('/shopping-lists', m('/shopping-lists', shoppingListsRouter));
  apiRouter.get('/shopping-lists/:id', m('/shopping-lists', shoppingListsRouter));
  apiRouter.post('/shopping-lists', withDb(withJson(mountPrefix('/shopping-lists', shoppingListsRouter))));
  apiRouter.put('/shopping-lists/:id', withDb(withJson(mountPrefix('/shopping-lists', shoppingListsRouter))));
  apiRouter.delete('/shopping-lists/:id', m('/shopping-lists', shoppingListsRouter));
  apiRouter.post('/shopping-lists/:id/items', withDb(withJson(mountPrefix('/shopping-lists', shoppingListsRouter))));
  apiRouter.patch('/shopping-lists/:id/items/:itemId', withDb(withJson(mountPrefix('/shopping-lists', shoppingListsRouter))));
  apiRouter.delete('/shopping-lists/:id/items/:itemId', m('/shopping-lists', shoppingListsRouter));

  // Collections
  apiRouter.get('/collections', m('/collections', collectionsRouter));
  apiRouter.get('/collections/:id', m('/collections', collectionsRouter));
  apiRouter.post('/collections', withDb(withJson(mountPrefix('/collections', collectionsRouter))));
  apiRouter.put('/collections/:id', withDb(withJson(mountPrefix('/collections', collectionsRouter))));
  apiRouter.delete('/collections/:id', m('/collections', collectionsRouter));
  apiRouter.post('/collections/:id/recipes/:recipeId', withDb(withJson(mountPrefix('/collections', collectionsRouter))));
  apiRouter.delete('/collections/:id/recipes/:recipeId', m('/collections', collectionsRouter));

  // Dietary Profiles
  apiRouter.get('/dietary-profiles', m('/dietary-profiles', dietaryProfilesRouter));
  apiRouter.get('/dietary-profiles/:id', m('/dietary-profiles', dietaryProfilesRouter));
  apiRouter.post('/dietary-profiles', withDb(withJson(mountPrefix('/dietary-profiles', dietaryProfilesRouter))));
  apiRouter.put('/dietary-profiles/:id', withDb(withJson(mountPrefix('/dietary-profiles', dietaryProfilesRouter))));
  apiRouter.delete('/dietary-profiles/:id', m('/dietary-profiles', dietaryProfilesRouter));

  // Cooking Logs
  apiRouter.get('/cooking-logs', m('/cooking-logs', cookingLogsRouter));
  apiRouter.get('/cooking-logs/:id', m('/cooking-logs', cookingLogsRouter));
  apiRouter.post('/cooking-logs', withDb(withJson(mountPrefix('/cooking-logs', cookingLogsRouter))));
  apiRouter.put('/cooking-logs/:id', withDb(withJson(mountPrefix('/cooking-logs', cookingLogsRouter))));
  apiRouter.delete('/cooking-logs/:id', m('/cooking-logs', cookingLogsRouter));

  // ---------------------------------------------------------------
  // Service routes
  // ---------------------------------------------------------------
  apiRouter.get('/search', m('/search', searchRouter));

  const mealPlannerMount = m('/meal-planner', mealPlannerRouter);
  apiRouter.get('/meal-planner/generate', mealPlannerMount);
  apiRouter.get('/meal-planner/suggest', mealPlannerMount);

  apiRouter.get('/shopping-list/generate/:mealPlanId', m('/shopping-list', shoppingListServiceRouter));

  apiRouter.get('/nutrition/estimate/:recipeId', m('/nutrition', nutritionRouter));

  apiRouter.get('/recommendations', m('/recommendations', recommendationRouter));

  apiRouter.get('/cost/estimate/:recipeId', m('/cost', costRouter));

  apiRouter.get('/dietary/check/:recipeId', m('/dietary', dietaryRouter));

  apiRouter.get('/convert', m('/convert', conversionRouter));

  apiRouter.post('/scale/:recipeId', withDb(withJson(mountPrefix('/scale', scalingRouter))));

  // Similarity
  apiRouter.get('/similarity/:recipeId', withDb(similarityRouter.handle.bind(similarityRouter)));
  apiRouter.post('/similarity/compare', withDb(withJson(similarityRouter.handle.bind(similarityRouter))));
  apiRouter.post('/similarity/batch', withDb(withJson(similarityRouter.handle.bind(similarityRouter))));
  apiRouter.post('/similarity/matrix', withDb(withJson(similarityRouter.handle.bind(similarityRouter))));
  apiRouter.post('/similarity/cluster', withDb(withJson(similarityRouter.handle.bind(similarityRouter))));
  apiRouter.get('/similarity/algorithms', similarityRouter.handle.bind(similarityRouter));
  apiRouter.get('/similarity/stats', similarityRouter.handle.bind(similarityRouter));
  apiRouter.delete('/similarity/cache', similarityRouter.handle.bind(similarityRouter));
  apiRouter.patch('/similarity/cache', withJson(similarityRouter.handle.bind(similarityRouter)));

  // Metrics
  apiRouter.get('/metrics/summary', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/all', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/aggregated', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/trends', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/anomalies', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/rate', metricsRouter.handle.bind(metricsRouter));
  apiRouter.get('/metrics/windows', metricsRouter.handle.bind(metricsRouter));
  apiRouter.post('/metrics/record', withJson(metricsRouter.handle.bind(metricsRouter)));
  apiRouter.delete('/metrics/all', metricsRouter.handle.bind(metricsRouter));
  apiRouter.patch('/metrics/enabled', withJson(metricsRouter.handle.bind(metricsRouter)));
  apiRouter.get('/metrics/health', metricsRouter.handle.bind(metricsRouter));

  // Workflows
  apiRouter.get('/workflows', workflowRouter.handle.bind(workflowRouter));
  apiRouter.get('/workflows/:workflowId', workflowRouter.handle.bind(workflowRouter));
  apiRouter.post('/workflows/:workflowId/execute', workflowRouter.handle.bind(workflowRouter));
  apiRouter.post('/workflows', withJson(workflowRouter.handle.bind(workflowRouter)));
  apiRouter.get('/workflows/history/list', workflowRouter.handle.bind(workflowRouter));
  apiRouter.get('/workflows/executions/active', workflowRouter.handle.bind(workflowRouter));

  // Relationships
  apiRouter.post('/relationships/analyze', withJson(relationshipRouter.handle.bind(relationshipRouter)));
  apiRouter.get('/relationships/related/:recipeId', relationshipRouter.handle.bind(relationshipRouter));
  apiRouter.get('/relationships/graph/:recipeId', relationshipRouter.handle.bind(relationshipRouter));
  apiRouter.get('/relationships/path/:recipeIdA/:recipeIdB', relationshipRouter.handle.bind(relationshipRouter));
  apiRouter.post('/relationships/batch', withJson(relationshipRouter.handle.bind(relationshipRouter)));
  apiRouter.post('/relationships/clear-cache', relationshipRouter.handle.bind(relationshipRouter));
  apiRouter.get('/relationships/types', relationshipRouter.handle.bind(relationshipRouter));

  // Coupling
  apiRouter.post('/coupling/modules', withJson(couplingRouter.handle.bind(couplingRouter)));
  apiRouter.post('/coupling/modules/:moduleId/dependencies', withJson(couplingRouter.handle.bind(couplingRouter)));
  apiRouter.get('/coupling/modules/:moduleId', couplingRouter.handle.bind(couplingRouter));
  apiRouter.get('/coupling/system', couplingRouter.handle.bind(couplingRouter));
  apiRouter.get('/coupling/analysis', couplingRouter.handle.bind(couplingRouter));
  apiRouter.get('/coupling/cycles', couplingRouter.handle.bind(couplingRouter));
  apiRouter.get('/coupling/scc', couplingRouter.handle.bind(couplingRouter));
  apiRouter.get('/coupling/modules/:moduleId/affected', couplingRouter.handle.bind(couplingRouter));
  apiRouter.post('/coupling/analyze', withJson(couplingRouter.handle.bind(couplingRouter)));
  apiRouter.post('/coupling/discover', withJson(couplingRouter.handle.bind(couplingRouter)));
  apiRouter.post('/coupling/reset', couplingRouter.handle.bind(couplingRouter));

  // Semantic Query
  apiRouter.get('/semantic/search', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.get('/semantic/search/keyword', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.get('/semantic/search/semantic', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.get('/semantic/symbols/:symbolName/references', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.get('/semantic/symbols/path', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.get('/semantic/stats', semanticQueryRouter.handle.bind(semanticQueryRouter));
  apiRouter.post('/semantic/reindex', semanticQueryRouter.handle.bind(semanticQueryRouter));

  // Coverage
  apiRouter.post('/coverage/modules', withJson(coverageRouter.handle.bind(coverageRouter)));
  apiRouter.post('/coverage/modules/:moduleId/coverage', withJson(coverageRouter.handle.bind(coverageRouter)));
  apiRouter.post('/coverage/modules/:moduleId/function-coverage', withJson(coverageRouter.handle.bind(coverageRouter)));
  apiRouter.post('/coverage/modules/:moduleId/branch-coverage', withJson(coverageRouter.handle.bind(coverageRouter)));
  apiRouter.get('/coverage/coverage-gaps', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/system-metrics', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/risk-modules', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/recommendations', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/cycles', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/scc', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/modules/:moduleId/affected', coverageRouter.handle.bind(coverageRouter));
  apiRouter.get('/coverage/analysis', coverageRouter.handle.bind(coverageRouter));
  apiRouter.post('/coverage/reset', coverageRouter.handle.bind(coverageRouter));

  // Scaffold
  apiRouter.post('/scaffold/parse', withJson(scaffoldRouter.handle.bind(scaffoldRouter)));
  apiRouter.post('/scaffold/parse-batch', withJson(scaffoldRouter.handle.bind(scaffoldRouter)));
  apiRouter.post('/scaffold/to-plan', withJson(scaffoldRouter.handle.bind(scaffoldRouter)));
  apiRouter.get('/scaffold/templates', scaffoldRouter.handle.bind(scaffoldRouter));

  // Hot Swap
  apiRouter.post('/hotswap/plugins', withJson(hotSwapRouter.handle.bind(hotSwapRouter)));
  apiRouter.post('/hotswap/plugins/:pluginId/load', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.post('/hotswap/plugins/:pluginId/activate', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.post('/hotswap/plugins/:pluginId/deactivate', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.post('/hotswap/plugins/:pluginId/swap', withJson(hotSwapRouter.handle.bind(hotSwapRouter)));
  apiRouter.post('/hotswap/plugins/:pluginId/unload', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/plugins/:pluginId', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/plugins', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/graph', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/coverage', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/cycles', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/metrics', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/symbols/:symbol/owner', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.get('/hotswap/symbols', hotSwapRouter.handle.bind(hotSwapRouter));
  apiRouter.post('/hotswap/hooks/:hookName/invoke', withJson(hotSwapRouter.handle.bind(hotSwapRouter)));
  apiRouter.post('/hotswap/install-order', withJson(hotSwapRouter.handle.bind(hotSwapRouter)));

  // Reviews
  apiRouter.post('/reviews', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.get('/reviews', reviewRouter.handle.bind(reviewRouter));
  apiRouter.get('/reviews/:reviewId', reviewRouter.handle.bind(reviewRouter));
  apiRouter.post('/reviews/:reviewId/transition', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.post('/reviews/:reviewId/agents', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.post('/reviews/:reviewId/findings', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.post('/reviews/:reviewId/complete', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.post('/reviews/:reviewId/threads', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.get('/agents', reviewRouter.handle.bind(reviewRouter));
  apiRouter.post('/agents', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.get('/agents/:agentId', reviewRouter.handle.bind(reviewRouter));
  apiRouter.post('/messages', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.post('/threads/:threadId/messages', withJson(reviewRouter.handle.bind(reviewRouter)));
  apiRouter.get('/symbols/:symbol/reviews', reviewRouter.handle.bind(reviewRouter));
  apiRouter.get('/reviews/overview', reviewRouter.handle.bind(reviewRouter));
  apiRouter.post('/reviews/reset', reviewRouter.handle.bind(reviewRouter));

  // Optimizer
  const optMount = m('/optimize', optimizerRouter);
  apiRouter.get('/optimize/meal-plan', optMount);
  apiRouter.post('/optimize/meal-plan/compare', withDb(withJson(mountPrefix('/optimize', optimizerRouter))));

  // Substitutions
  const subMount = m('/substitutions', substitutionRouter);
  apiRouter.get('/substitutions/find', subMount);
  apiRouter.get('/substitutions/swap', subMount);
  apiRouter.get('/substitutions/compatibility', subMount);
  apiRouter.get('/substitutions/parse-constraint', subMount);

  // ---------------------------------------------------------------
  // Merged routers (Phase 8 MCP Challenge)
  // ---------------------------------------------------------------
  mergeRouters(apiRouter, dynamicRequireRouter);
  mergeRouters(apiRouter, polymorphicSymbolRouter);
  mergeRouters(apiRouter, implicitDependencyRouter);
  mergeRouters(apiRouter, mutationRouter);
  mergeRouters(apiRouter, queryDecompositionRouter);

  // ---------------------------------------------------------------
  // Programmatic prefix-mounted routes (Phase 9+)
  // ---------------------------------------------------------------
  [
    ['/symbols', require('./routes/symbolResolverRoutes')],
    ['/build-graph', require('./routes/buildGraphRoutes')],
    ['/workflow-planner', require('./routes/workflowPlannerRoutes')],
    ['/coordination', require('./routes/agentCoordinationRoutes')],
    ['/concerns', require('./routes/concernDetectorRoutes')],
    ['/contracts', require('./routes/contractValidatorRoutes')],
    // Review Nine MCP Challenge Routes
    ['/event-tracer', require('./routes/eventTracerRoutes')],
    ['/coverage-mapper', require('./routes/coverageMapperRoutes')],
    ['/plan-merger', require('./routes/planMergerRoutes')],
    ['/task-executor', require('./routes/taskExecutorRoutes')],
    ['/health-auditor', require('./routes/healthAuditorRoutes')],
    ['/impact-predictor', require('./routes/impactPredictorRoutes')],
    ['/aliases', require('./routes/aliasRoutes')],
    ['/state-machine', require('./routes/stateMachineRoutes')()],
    ['/test-pyramid', require('./routes/testPyramidRoutes')],
    ['/validate', require('./routes/parallelValidatorRoutes')],
    ['/knowledge-graph', require('./routes/knowledgeGraphRoutes')],
    ['/pipeline', require('./routes/pipelineRoutes')],
    // VCS routes (branch, diff, version — merged from 3 files)
    ['', createVcsRoutes(getDb())],
    // Review Eleven MCP Challenge Routes
    ['/test-impact', require('./routes/testImpactRoutes')],
    ['/semantic-nav', require('./routes/semanticNavigatorRoutes')],
    ['/workflow-orchestrator', require('./routes/workflowOrchestratorRoutes')],
    ['/distributed-validator', require('./routes/distributedValidatorRoutes')],
    ['/lineage', require('./routes/lineageRoutes')],
    ['/compiler', require('./routes/compilerRoutes')],
    // RecipeQL query engine
    ['/recipeql', require('./routes/recipeQLRoutes')],
    // Event Sourcing routes
    ['/event-sourcing', require('./routes/eventSourcingRoutes')],
    // Recipe Optimization Pipeline
    ['', require('./routes/optPipelineRoutes')],
    // Parallel Enrichment
    ['', require('./routes/enrichmentRoutes')],
    // Tiered Cache
    ['', require('./routes/tieredCacheRoutes')],
    // Recipe DSL
    ['/dsl', require('./routes/recipeDSLRoutes')],
    // Review Fourteen MCP Challenge Routes
    ['', require('./routes/namespaceCollisionRoutes')],
    ['', require('./routes/importFanoutRoutes')],
    ['', require('./routes/snapshotBundleRoutes')],
    ['', require('./routes/validationShardsRoutes')],
    ['', require('./routes/queryPlannerRoutes')],
    ['', require('./routes/deltaMergeRoutes')]
  ].forEach(([prefix, router]) => {
    for (const route of router.routes) {
      const fullPattern = prefix + route.pattern;
      const needsJson = route.method === 'POST' || route.method === 'PUT' || route.method === 'PATCH';
      const handler = needsJson
        ? withJson((req, res) => route.handler(req, res))
        : (req, res) => route.handler(req, res);
      apiRouter.addRoute(route.method, fullPattern, handler);
    }
  });
}

module.exports = { loadRoutes };
