'use strict';

// regionD_snacks — built by subD under coordination lock.

function composeSnackSlot(recipes) {
  if (!Array.isArray(recipes)) return null;
  const snackTags = ['snack', 'fruit', 'nuts', 'cookie', 'bar'];
  const candidates = recipes.filter((r) =>
    Array.isArray(r.tags) && r.tags.some((t) => snackTags.indexOf(t) >= 0));
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestScore = scoreSnack(best, snackTags);
  for (const c of candidates.slice(1)) {
    const s = scoreSnack(c, snackTags);
    if (s > bestScore) { best = c; bestScore = s; }
  }
  return { slot: 'snack', recipe: best, score: bestScore };
}

function scoreSnack(recipe, snackTags) {
  if (!Array.isArray(recipe.tags)) return 0;
  let s = 0;
  for (const t of recipe.tags) if (snackTags.indexOf(t) >= 0) s += 1;
  return s;
}

module.exports = { composeSnackSlot, scoreSnack };
