'use strict';

function validateRecipe(recipe) {
  const errors = [];
  if (!recipe || typeof recipe !== 'object') {
    return { ok: false, errors: ['not an object'] };
  }
  if (recipe.id == null) errors.push('missing id');
  if (typeof recipe.name !== 'string' || !recipe.name.trim()) errors.push('missing name');
  if (!Array.isArray(recipe.ingredients)) errors.push('ingredients not an array');
  else {
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ing = recipe.ingredients[i];
      if (!ing || typeof ing !== 'object') {
        errors.push(`ingredient[${i}] not an object`);
        continue;
      }
      if (typeof ing.name !== 'string' || !ing.name.trim()) {
        errors.push(`ingredient[${i}] missing name`);
      }
      if (ing.quantity != null && typeof ing.quantity !== 'number') {
        errors.push(`ingredient[${i}] quantity not a number`);
      }
    }
  }
  if (recipe.servings != null && (typeof recipe.servings !== 'number' || recipe.servings <= 0)) {
    errors.push('servings must be a positive number');
  }
  return { ok: errors.length === 0, errors };
}

function validateShard(shard) {
  if (!shard || typeof shard !== 'object') {
    throw new Error('shardValidator: shard must be an object');
  }
  if (!Number.isInteger(shard.shardId) || shard.shardId < 0) {
    throw new Error('shardValidator: shardId must be non-negative integer');
  }
  if (!Array.isArray(shard.recipes)) {
    throw new Error('shardValidator: recipes must be an array');
  }
  const results = shard.recipes.map((r) => ({
    recipeId: r && r.id,
    validation: validateRecipe(r)
  }));
  const failures = results.filter((r) => !r.validation.ok);
  return {
    shardId: shard.shardId,
    recipeCount: shard.recipes.length,
    failureCount: failures.length,
    results
  };
}

module.exports = { validateRecipe, validateShard };
