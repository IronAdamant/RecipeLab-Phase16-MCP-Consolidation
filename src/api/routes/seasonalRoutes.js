'use strict';

const { Router } = require('../../utils/router');
const { success, badRequest } = require('../../utils/response');
const { createRotator } = require('../../services/seasonalRecipeRotator');

function createSeasonalRoutes(db) {
  const router = new Router();

  router.get('/seasonal/:season', (req, res) => {
    const { season } = req.params;
    const strategy = (req.query && req.query.strategy) || 'roundRobin';
    const rotator = createRotator({ strategy });
    if (!rotator.seasons().includes(season)) {
      return badRequest(res, 'invalid season');
    }
    const all = (db.find && db.find('recipes', () => true)) || [];
    const rotated = rotator.rotate(all, season);
    return success(res, { season, strategy: rotator.strategyName(), recipes: rotated });
  });

  router.get('/seasonal', (req, res) => {
    const rotator = createRotator();
    return success(res, {
      seasons: rotator.seasons(),
      strategies: ['roundRobin', 'weighted']
    });
  });

  return router;
}

module.exports = createSeasonalRoutes;
