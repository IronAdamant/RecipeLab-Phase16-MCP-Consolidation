'use strict';

// regionB_lunch — built by subB under coordination lock.

function composeLunchSlot(recipes) {
  if (!Array.isArray(recipes)) return null;
  const lunchTags = ['lunch', 'salad', 'sandwich', 'wrap', 'soup'];
  const candidates = recipes.filter((r) =>
    Array.isArray(r.tags) && r.tags.some((t) => lunchTags.indexOf(t) >= 0));
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestScore = scoreLunch(best, lunchTags);
  for (const c of candidates.slice(1)) {
    const s = scoreLunch(c, lunchTags);
    if (s > bestScore) { best = c; bestScore = s; }
  }
  return { slot: 'lunch', recipe: best, score: bestScore };
}

function scoreLunch(recipe, lunchTags) {
  if (!Array.isArray(recipe.tags)) return 0;
  let s = 0;
  for (const t of recipe.tags) if (lunchTags.indexOf(t) >= 0) s += 1;
  return s;
}

module.exports = { composeLunchSlot, scoreLunch };
