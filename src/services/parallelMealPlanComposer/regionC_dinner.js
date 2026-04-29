'use strict';

// regionC_dinner — built by subC under coordination lock.

function composeDinnerSlot(recipes) {
  if (!Array.isArray(recipes)) return null;
  const dinnerTags = ['dinner', 'roast', 'stew', 'pasta', 'curry'];
  const candidates = recipes.filter((r) =>
    Array.isArray(r.tags) && r.tags.some((t) => dinnerTags.indexOf(t) >= 0));
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestScore = scoreDinner(best, dinnerTags);
  for (const c of candidates.slice(1)) {
    const s = scoreDinner(c, dinnerTags);
    if (s > bestScore) { best = c; bestScore = s; }
  }
  return { slot: 'dinner', recipe: best, score: bestScore };
}

function scoreDinner(recipe, dinnerTags) {
  if (!Array.isArray(recipe.tags)) return 0;
  let s = 0;
  for (const t of recipe.tags) if (dinnerTags.indexOf(t) >= 0) s += 1;
  return s;
}

module.exports = { composeDinnerSlot, scoreDinner };
