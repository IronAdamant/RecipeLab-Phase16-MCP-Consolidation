'use strict';

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function shardIdForRecipe(recipeId, shardCount) {
  if (!Number.isInteger(shardCount) || shardCount <= 0) {
    throw new Error('shardManager: shardCount must be a positive integer');
  }
  const id = typeof recipeId === 'string' ? recipeId : String(recipeId);
  return fnv1a(id) % shardCount;
}

function distributeRecipes(recipes, shardCount) {
  if (!Array.isArray(recipes)) {
    throw new Error('shardManager: recipes must be an array');
  }
  if (!Number.isInteger(shardCount) || shardCount <= 0) {
    throw new Error('shardManager: shardCount must be a positive integer');
  }
  const shards = [];
  for (let i = 0; i < shardCount; i++) {
    shards.push({ shardId: i, recipes: [] });
  }
  for (const recipe of recipes) {
    if (!recipe || recipe.id == null) continue;
    const sid = shardIdForRecipe(recipe.id, shardCount);
    shards[sid].recipes.push(recipe);
  }
  return shards;
}

function buildAgentId(parentAgentId, shardId) {
  if (typeof parentAgentId !== 'string' || !parentAgentId) {
    throw new Error('shardManager: parentAgentId must be a non-empty string');
  }
  if (!Number.isInteger(shardId) || shardId < 0) {
    throw new Error('shardManager: shardId must be a non-negative integer');
  }
  return `${parentAgentId}.shard.${shardId}`;
}

module.exports = {
  fnv1a,
  shardIdForRecipe,
  distributeRecipes,
  buildAgentId
};
