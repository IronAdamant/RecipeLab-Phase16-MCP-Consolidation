'use strict';

// parallelMealPlanComposer — facade. Built by main hub agent after the 4
// region modules were independently produced under separate file locks.

const { composeBreakfastSlot } = require('./regionA_breakfast');
const { composeLunchSlot }     = require('./regionB_lunch');
const { composeDinnerSlot }    = require('./regionC_dinner');
const { composeSnackSlot }     = require('./regionD_snacks');

const SLOT_FNS = {
  breakfast: composeBreakfastSlot,
  lunch: composeLunchSlot,
  dinner: composeDinnerSlot,
  snack: composeSnackSlot
};

const DEFAULT_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

function composeMealPlan(recipes, opts) {
  if (!Array.isArray(recipes)) return { plan: {}, missing: DEFAULT_SLOTS.slice() };
  const o = opts || {};
  const slots = Array.isArray(o.slots) && o.slots.length > 0 ? o.slots : DEFAULT_SLOTS;
  const plan = {};
  const missing = [];
  for (const slot of slots) {
    const fn = SLOT_FNS[slot];
    if (typeof fn !== 'function') { missing.push(slot); continue; }
    const out = fn(recipes);
    if (out && out.recipe) plan[slot] = out;
    else missing.push(slot);
  }
  return { plan, missing };
}

function listSlots() { return DEFAULT_SLOTS.slice(); }

module.exports = { composeMealPlan, listSlots, SLOT_FNS };
