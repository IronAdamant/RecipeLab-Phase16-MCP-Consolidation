'use strict';

const manager = require('./shardManager');

class ShardRegistry {
  constructor() {
    this.assignments = new Map();
    this.reverse = new Map();
  }

  assign(shardId, agentId) {
    if (!Number.isInteger(shardId) || shardId < 0) {
      throw new Error('shardRegistry: shardId must be non-negative integer');
    }
    if (typeof agentId !== 'string' || !agentId) {
      throw new Error('shardRegistry: agentId must be a non-empty string');
    }
    if (this.assignments.has(shardId)) {
      throw new Error(`shardRegistry: shard ${shardId} already assigned to ${this.assignments.get(shardId)}`);
    }
    if (this.reverse.has(agentId)) {
      throw new Error(`shardRegistry: agent ${agentId} already owns shard ${this.reverse.get(agentId)}`);
    }
    this.assignments.set(shardId, agentId);
    this.reverse.set(agentId, shardId);
  }

  release(shardId) {
    if (!this.assignments.has(shardId)) return false;
    const agentId = this.assignments.get(shardId);
    this.assignments.delete(shardId);
    this.reverse.delete(agentId);
    return true;
  }

  agentFor(shardId) {
    return this.assignments.get(shardId) || null;
  }

  shardFor(agentId) {
    return this.reverse.has(agentId) ? this.reverse.get(agentId) : null;
  }

  listAssignments() {
    const out = [];
    for (const [shardId, agentId] of this.assignments.entries()) {
      out.push({ shardId, agentId });
    }
    out.sort((a, b) => a.shardId - b.shardId);
    return out;
  }

  assignAll(parentAgentId, shardCount) {
    for (let i = 0; i < shardCount; i++) {
      this.assign(i, manager.buildAgentId(parentAgentId, i));
    }
    return this.listAssignments();
  }

  size() {
    return this.assignments.size;
  }
}

module.exports = { ShardRegistry };
