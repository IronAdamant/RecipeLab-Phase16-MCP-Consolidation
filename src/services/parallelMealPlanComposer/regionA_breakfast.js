'use strict';

// regionA_breakfast — built by subA under coordination lock.
// Provides breakfast slot composition for the parallelMealPlanComposer.

function composeBreakfastSlot(recipes) {
  if (!Array.isArray(recipes)) return null;
  const breakfastTags = ['breakfast', 'oatmeal', 'eggs', 'pancake', 'smoothie'];
  const candidates = recipes.filter((r) =>
    Array.isArray(r.tags) && r.tags.some((t) => breakfastTags.indexOf(t) >= 0));
  if (!candidates.length) return null;
  // Pick the candidate with the most matching breakfast tags
  let best = candidates[0];
  let bestScore = scoreBreakfast(best, breakfastTags);
  for (const c of candidates.slice(1)) {
    const s = scoreBreakfast(c, breakfastTags);
    if (s > bestScore) { best = c; bestScore = s; }
  }
  return { slot: 'breakfast', recipe: best, score: bestScore };
}

function scoreBreakfast(recipe, breakfastTags) {
  if (!Array.isArray(recipe.tags)) return 0;
  let s = 0;
  for (const t of recipe.tags) if (breakfastTags.indexOf(t) >= 0) s += 1;
  return s;
}

module.exports = { composeBreakfastSlot, scoreBreakfast };
