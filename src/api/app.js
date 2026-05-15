'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { createRouter, mountPrefix } = require('../utils/router');
const { parseJsonBody } = require('../utils/request');
const { initializeDatabase } = require('../db');
const { json, error, notFound, badRequest } = require('../utils/response');
const { ValidationError } = require('../utils/validation');
const { loadCoreRoutes } = require('./routeLoaderCore');
const { loadMCPMetaRoutes } = require('./routeLoaderMCPMeta');
const PluginSystemFacade = require('../plugins/PluginSystemFacade');

const ServerResponse = http.ServerResponse;
if (!ServerResponse.prototype.json) {
  ServerResponse.prototype.status = function statusCode(code) {
    this.statusCode = code;
    return this;
  };
  ServerResponse.prototype.json = function jsonBody(body) {
    this.setHeader('Content-Type', 'application/json');
    if (this.statusCode == null || Number.isNaN(this.statusCode)) {
      this.statusCode = 200;
    }
    this.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
}

/**
 * Main API application.
 * Replaces Express app for zero-dependency implementation.
 */

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../../public');

const apiRouter = createRouter();

let db;
function getDb() {
  if (!db) {
    db = initializeDatabase(path.join(__dirname, '../../data'));
  }
  return db;
}

function withDb(handler) {
  return (req, res) => {
    req.db = getDb();
    return handler(req, res);
  };
}

function withJson(handler) {
  return async (req, res) => {
    try {
      await parseJsonBody(req);
      return handler(req, res);
    } catch (err) {
      badRequest(res, err.message || 'Invalid JSON');
    }
  };
}

function errorHandler(err, req, res) {
  console.error('Error:', err.message);

  if (err instanceof ValidationError) {
    return badRequest(res, err.message, { field: err.field });
  }

  error(res, err.message || 'Internal server error', err.status || 500);
}

function m(prefix, router) {
  return withDb(mountPrefix(prefix, router));
}

// Initialize the unified plugin system (facade over legacy PluginManager + DynamicPluginManager)
const pluginSystem = new PluginSystemFacade(getDb(), path.join(__dirname, '../../'));
pluginSystem.initialize().catch(err => console.error('Plugin system init failed:', err));

// Register routes using the new Phase 16 split system (Batch D)
loadCoreRoutes(apiRouter, { getDb, withDb, withJson, m });
loadMCPMetaRoutes(apiRouter, { getDb, withDb, withJson, m }, pluginSystem);

// Execute post-load plugin hook for MCP stress + parity
pluginSystem.executeHook('afterRoutesLoaded', {
  core: 'routeLoaderCore',
  meta: 'routeLoaderMCPMeta',
  pluginFacade: 'unified'
}).catch(err => console.error('afterRoutesLoaded hook error:', err));

function serveStatic(req, res, parsedUrl) {
  let filePath = parsedUrl.pathname;

  filePath = filePath.split('?')[0];

  if (filePath === '/') {
    filePath = '/index.html';
  }

  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return notFound(res, 'Not found');
  }

  if (!fs.existsSync(fullPath)) {
    return notFound(res, 'Not found');
  }

  const ext = path.extname(fullPath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = contentTypes[ext] || 'text/plain';

  res.setHeader('Content-Type', contentType);
  const content = fs.readFileSync(fullPath);
  res.end(content);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  try {
    if (parsedUrl.pathname.startsWith('/api')) {
      let newPath = parsedUrl.pathname.slice(4) || '/';
      req.url = newPath + (parsedUrl.search || '');
      apiRouter.handle(req, res);
    } else {
      serveStatic(req, res, parsedUrl);
    }
  } catch (err) {
    errorHandler(err, req, res);
  }
});

server.listen(PORT, () => {
  console.log(`RecipeLab API server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = { app: server };
