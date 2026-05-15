'use strict';

/**
 * PluginSystemFacade.js
 *
 * Phase 16 — Unified facade over the old PluginManager and the new DynamicPluginManager.
 * This cleans up the duplication between the two plugin systems.
 */

const { PluginManager } = require('./PluginManager');
const DynamicPluginManager = require('./DynamicPluginManager');

class PluginSystemFacade {
  constructor(db, projectRoot) {
    // Adapt to actual export styles: PluginManager exports { PluginManager: class }, Dynamic exports singleton instance
    const PM = PluginManager; // the destructured class
    this.legacy = new PM(); // ignore db for now (original PluginManager ctor takes no arg; db stored at higher level if needed)
    this.dynamic = DynamicPluginManager; // already an instantiated singleton from its module
    if (projectRoot && this.dynamic && typeof this.dynamic.initialize === 'function') {
      // future: pass projectRoot if Dynamic supports it
    }
    this.initialized = false;
  }

  async initialize() {
    if (this.legacy && typeof this.legacy.initialize === 'function') await this.legacy.initialize();
    if (this.dynamic && typeof this.dynamic.initialize === 'function') await this.dynamic.initialize();
    this.initialized = true;
  }

  registerPlugin(plugin) {
    // Route to the appropriate manager based on plugin type
    if (plugin.dynamic || plugin.hooks) {
      return this.dynamic.registerPlugin(plugin);
    }
    return this.legacy.registerPlugin(plugin);
  }

  getPlugin(name) {
    return this.dynamic.getPlugin(name) || this.legacy.getPlugin(name);
  }

  async executeHook(hookName, context) {
    // Robust delegation: legacy uses dispatch/dispatchSync, dynamic uses invokeDynamicHook
    let legacyResult = null;
    let dynamicResult = null;

    try {
      if (typeof this.legacy.executeHook === 'function') {
        legacyResult = await this.legacy.executeHook(hookName, context);
      } else if (typeof this.legacy.dispatch === 'function') {
        legacyResult = await this.legacy.dispatch(hookName, context);
      } else if (typeof this.legacy.dispatchSync === 'function') {
        legacyResult = this.legacy.dispatchSync(hookName, context);
      }
    } catch (e) { legacyResult = { error: e.message }; }

    try {
      if (typeof this.dynamic.executeHook === 'function') {
        dynamicResult = await this.dynamic.executeHook(hookName, context);
      } else if (typeof this.dynamic.invokeDynamicHook === 'function') {
        dynamicResult = await this.dynamic.invokeDynamicHook(hookName, context);
      }
    } catch (e) { dynamicResult = { error: e.message }; }

    return { legacy: legacyResult, dynamic: dynamicResult };
  }

  getAllPlugins() {
    const legacyList = typeof this.legacy.getAllPlugins === 'function' ? this.legacy.getAllPlugins()
      : (typeof this.legacy.getPlugins === 'function' ? this.legacy.getPlugins() : []);
    const dynamicList = typeof this.dynamic.getAllPlugins === 'function' ? this.dynamic.getAllPlugins()
      : (typeof this.dynamic.getPlugins === 'function' ? this.dynamic.getPlugins() : (this.dynamic.getDynamicRoutes ? this.dynamic.getDynamicRoutes() : []));
    return { legacy: legacyList, dynamic: dynamicList };
  }
}

module.exports = PluginSystemFacade;