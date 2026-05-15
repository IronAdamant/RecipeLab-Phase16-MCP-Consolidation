'use strict';

/**
 * routeLoaderMCPMeta.js
 *
 * Phase 16 — MCP challenge / meta routes only.
 * Split from the monolithic ~24k-line routeLoader.js (now in legacy/ for MCP stress analysis).
 * Contains 50+ synthetic MCP probe, challenge, orchestration, and meta routes.
 * Accepts helpers context + optional pluginFacade for hook execution on meta registration.
 */

const fs = require('fs');
const path = require('path');

function loadMCPMetaRoutes(apiRouter, helpers = {}, pluginFacade = null) {
  const { withJson, m } = helpers;
  const routesDir = path.join(__dirname, 'routes');

  const metaKeywords = [
    'mcp', 'challenge', 'probe', 'workflow', 'scaffold', 'coverage', 'impact', 'symbol',
    'semantic', 'query', 'stateMachine', 'hotSwap', 'dynamicRequire', 'polymorphic',
    'importFanout', 'diamondDAG', 'bowTie', 'reexportChain', 'namespaceCollision',
    'phantomDependency', 'circularScaffold', 'conditionalRequire', 'dynamicSymbol',
    'agentTerritory', 'selfReferential', 'validationShards', 'snapshotBundle',
    'tieredCache', 'swarmIndex', 'knowledgeGraph', 'lineage', 'provenance', 'mutation',
    'polyglot', 'recipeQL', 'recipeDSL', 'recipeFingerprint', 'recipeReconciler',
    'recipeSemantic', 'regionLock', 'semanticNavigator', 'semanticQuery',
    'unifiedReadiness', 'eventSourcing', 'deltaMerge', 'decomposition', 'macroExpansion',
    'queryPlanner', 'planMerger', 'parallelValidator', 'parallelEnrichment',
    'parallelMealPlan', 'recipeOptPipeline', 'recipeBuildPipeline', 'recipeCompiler',
    'recipeNutrient', 'recipeProvenance', 'recipeQualityAssurance', 'recipeRefactor',
    'recipeTransformation', 'similarityEngines', 'seasonalRecipeRotator',
    'crossRecipeNutrient', 'metrics', 'optimizer', 'taskExecutor', 'distributed',
    'multiAgent', 'pluginMarketplace', 'versionControl', 'workflowOrchestrator',
    'hookChain', 'hierarchical', 'granularCoverage', 'dynamicCodeCoverage',
    'testImpact', 'testAffinity', 'testPyramid', 'symbolImpact', 'symbolShadow',
    'runtimeSymbol', 'runtimeDependency', 'implicitDependency', 'incrementalBuild',
    'DeepImportCoupling', 'couplingExplorer', 'relationshipAnalyzer',
    'contextualSymbol', 'crossModuleSymbol', 'crossAgentCode', 'crossCuttingConcern',
    'moduleContract', 'featureDecomposition', 'hierarchicalDependency',
    'hierarchicalTask', 'conditionalWorkflow', 'conflictAwarePlan',
    'ScaffoldWorkflow', 'requirementsToScaffold'
  ];

  const metaFiles = fs.readdirSync(routesDir).filter(f =>
    metaKeywords.some(kw => f.includes(kw))
  );

  metaFiles.forEach(file => {
    try {
      const routeMod = require(path.join(routesDir, file));
      if (typeof routeMod === 'function') {
        // register-style (e.g. registerMcpChallengeRoutes(apiRouter, projectRoot))
        routeMod(apiRouter, path.join(__dirname, '../..'));
      } else if (routeMod && typeof routeMod === 'object' && routeMod.routes) {
        // array-of-routes style used by many meta probes (see legacy forEach)
        for (const r of routeMod.routes) {
          const fullPattern = (routeMod.prefix || '') + r.pattern;
          const needsJson = r.method === 'POST' || r.method === 'PUT' || r.method === 'PATCH';
          const handler = needsJson && withJson
            ? withJson((req, res) => r.handler(req, res))
            : (req, res) => r.handler(req, res);
          apiRouter.addRoute(r.method, fullPattern, handler);
        }
      } else if (routeMod && typeof routeMod.handle === 'function') {
        // router object with handle — mount on conventional /meta or filename-based prefix
        const base = '/' + file.replace(/Routes\.js$/, '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        if (m) {
          apiRouter.get(base, m(base, routeMod));
        }
      }
    } catch (e) {
      console.warn(`Failed to load meta route ${file}: ${e.message}`);
    }
  });

  // If pluginFacade provided, execute a post-meta-load hook for MCP stress signal (defensive)
  if (pluginFacade && typeof pluginFacade.executeHook === 'function') {
    try { pluginFacade.executeHook('afterMetaRoutesLoaded', { metaFileCount: metaFiles.length }).catch(() => {}); } catch (_) {}
  }
}

module.exports = { loadMCPMetaRoutes };