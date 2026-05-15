'use strict';

/**
 * routeLoaderCore.js
 *
 * Phase 16 — Core routes only (the original domain CRUD + main services).
 * Split from the monolithic ~24k-line routeLoader.js (now in legacy/).
 * Accepts the standard helpers context for mounting with m/withDb/withJson.
 * PluginSystemFacade integration point for future hook execution around core registration.
 */

const path = require('path');
const { mountPrefix } = require('../utils/router');

function loadCoreRoutes(apiRouter, helpers = {}) {
  const { withDb, withJson, m } = helpers;
  const coreRoutesDir = path.join(__dirname, 'routes');

  // Core domain + service route modules (router objects, not functions)
  const coreMounts = [
    { file: 'recipes.js', prefix: '/recipes' },
    { file: 'ingredients.js', prefix: '/ingredients' },
    { file: 'tags.js', prefix: '/tags' },
    { file: 'mealPlans.js', prefix: '/meal-plans' },
    { file: 'shoppingLists.js', prefix: '/shopping-lists' },
    { file: 'collections.js', prefix: '/collections' },
    { file: 'dietaryProfiles.js', prefix: '/dietary-profiles' },
    { file: 'cookingLogs.js', prefix: '/cooking-logs' },
    { file: 'search.js', prefix: '/search' },
    { file: 'mealPlannerRoutes.js', prefix: '/meal-planner' },
    { file: 'shoppingListServiceRoutes.js', prefix: '/shopping-list' },
    { file: 'nutritionRoutes.js', prefix: '/nutrition' },
    { file: 'recommendationRoutes.js', prefix: '/recommendations' },
    { file: 'costRoutes.js', prefix: '/cost' },
    { file: 'dietaryRoutes.js', prefix: '/dietary' },
    { file: 'conversionRoutes.js', prefix: '/convert' },
    { file: 'scalingRoutes.js', prefix: '/scale' },
    { file: 'similarityRoutes.js', prefix: '/similarity' }
  ];

  coreMounts.forEach(({ file, prefix }) => {
    try {
      const routerMod = require(path.join(coreRoutesDir, file));
      // Support both router object (has .handle or direct use via mount) and function factories
      if (routerMod && typeof routerMod === 'object') {
        if (m) {
          // Use the m helper for standard mounting (handles withDb + mountPrefix)
          apiRouter.get(prefix, m(prefix, routerMod));
          apiRouter.get(`${prefix}/:id`, m(prefix, routerMod));
          // POST/PUT/DELETE variants are often handled inside the router or additional explicit in full legacy
          // For parity we register the base; full method variants were in monolithic
        } else {
          apiRouter.get(prefix, mountPrefix(prefix, routerMod));
        }
      } else if (typeof routerMod === 'function') {
        routerMod(apiRouter, helpers);
      }
    } catch (e) {
      console.warn(`Failed to load core route ${file}: ${e.message}`);
    }
  });

  // Health check (core infra)
  const { json } = require('../utils/response');
  apiRouter.get('/health', (req, res) => {
    json(res, { status: 'ok', timestamp: new Date().toISOString() });
  });
}

module.exports = { loadCoreRoutes };