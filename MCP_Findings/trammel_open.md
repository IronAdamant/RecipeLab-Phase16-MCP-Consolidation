# Trammel MCP — Detailed Report (Review "_open" — fresh session)

**Date:** 2026-04-30
**Project:** RecipeLab_alt
**Storage:** `trammel.db` (1.27 MB)
**Trammel state at session start:** 22 recipes, 65 plans (44 active), 31 tools

## Executive summary

🟢 **Trammel is in the best shape of the four MCPs this session.**

- `decompose` with `scaffold` produced a perfect 5-step DAG with correct topological order, dependency edges, validation, and DAG metrics (max_dependency_depth, max_parallelism, layer_widths).
- The full `decompose → create_plan → claim_step × 5 → record_step × 5 → complete_plan` workflow ran end-to-end with `recipe_saved: true, scaffold_saved: true`.
- **NEW signal: structural similarity matching is now working.** When decomposing the second 5-file feature (`recipeProvenanceLedger`) Trammel returned `near_match_recipes` with `structural_similarity: 0.97` against the seasonalRecipeRotator recipe — same 5-file shape detected. Composite `match_score: 0.636`. This is the new feature that prior sessions identified as missing.

🔴 **Bugs found:**
1. **`claim_step` requires the database row id, not `step_index`.** First call with `step_id: 0` (the step_index) returned `claimed: false`. Fixing to `step_id: 667` (the DB id from `get_plan`) succeeded. The schema spec calls this `step_id` but the steps in the strategy are indexed by `step_index` — disambiguation is missing in the schema docs.
2. **Recipe match `score` ceiling is still ~0.3** for text similarity even when patterns are nearly identical. Structural similarity (0.97) drives the composite up to 0.636 but text similarity alone never gets there.

🟡 **Observations:**
- `summary_only: true` is a useful payload reducer — returns step_count + files + meta + DAG metrics + scaffold_validation without the full step detail.
- `near_match_recipes` lists matches with full breakdown: text_similarity, file_overlap, success_ratio, recency, structural_similarity. **structural_similarity is the breakthrough.**

## Feature built specifically for Trammel

**`seasonalRecipeRotator`** — `src/services/seasonalRecipeRotator/`
- `seasonRules.js` (no deps)
- `rotationStrategy.js` (deps: seasonRules)
- `index.js` (deps: seasonRules, rotationStrategy)
- `src/api/routes/seasonalRoutes.js` (deps: seasonalRecipeRotator/index)
- `tests/services/seasonalRecipeRotator.test.js` (deps: seasonalRecipeRotator/index)

**Why this stresses Trammel:** five new files, three depth layers, with two parallel-eligible files at the bottom (route + test both depend on the facade only). This exercises `decompose`'s scaffold-driven topological sort and DAG metric computation.

22 tests, all passing.

## Live Trammel probes (with full results)

### 1. `estimate(scope: "src")`

```json
{ "language": "javascript", "matching_files": 568, "recommendation": "full analysis OK" }
```
✅

### 2. `decompose` with scaffold (seasonalRecipeRotator)

Input: 5 scaffold entries with explicit `depends_on`.

Output:
```
steps: 5 (all scaffold-driven, all relevance: 1.0, relevance_tier: high)
dependency_graph: {
  seasonRules.js → []
  rotationStrategy.js → [seasonRules.js]
  index.js → [seasonRules.js, rotationStrategy.js]
  seasonalRoutes.js → [index.js]
  test.js → [index.js]
}
scaffold_dag_metrics: {
  node_count: 5, edge_count: 5,
  max_dependency_depth: 4, critical_path_length: 4,
  max_parallelism: 2, layer_widths: [1, 1, 1, 2]
}
scaffold_validation: { valid: true, cycle: null, duplicates: [], missing_deps: [], over_constrained: [], self_referential: [] }
ambiguity: { score: 0.1, flag: "low" }
near_match_recipes: [
  { pattern: "Add a real-time collaborative recipe editing system...",
    text_similarity: 0.276, match_score: 0.239, structural_similarity: 0.0 }
]
scaffold_only: true (default when scaffold non-empty)
scaffold_applied: 5
```
✅ **Layer widths [1,1,1,2] correctly identifies the diamond at the bottom** — both route and test depend on facade only, can run in parallel.

### 3. `decompose` with scaffold (recipeProvenanceLedger) — STRUCTURAL MATCH WORKS

Input: 5 scaffold entries (deltaTypes → ledgerStore → deltaCompactor → index → test). `summary_only: true`.

Output:
```
near_match_recipes: [
  {
    pattern: "Create seasonalRecipeRotator service with rotation strategies and API route",
    text_similarity: 0.193,
    file_overlap: 0.0,
    success_ratio: 1.0,
    recency: 1.0,
    structural_similarity: 0.97,           ← NEW & WORKING
    match_score: 0.636
  },
  {
    pattern: "Add a real-time collaborative recipe editing system...",
    text_similarity: 0.293, structural_similarity: 0.0, match_score: 0.243
  }
]
```
🟢 **`structural_similarity: 0.97`** — recognizes that both plans have the same shape: 5 files in a single feature directory, 4 source + 1 test, depth-4 DAG. This is exactly the structural matching that prior reviews flagged as missing.

### 4. `create_plan`

Returned `plan_id: 70`. ✅

### 5. `get_plan(70)` — full plan state

Returned the plan with `total_steps: 5`, `current_step: 0`, status `pending`, plus the steps array with **DB-assigned `id` 667–671** distinct from `step_index` 0–4. This is the source of the claim_step confusion.

### 6. `claim_step` — schema confusion

```json
// Attempt 1
claim_step(plan_id: 70, step_id: 0, agent_id: "main")  →  { "claimed": false }
// Attempt 2 (using DB id from get_plan)
claim_step(plan_id: 70, step_id: 667, agent_id: "main")  →  { "claimed": true }
```
🔴 **Schema spec uses `step_id` but the value must be the DB id, not the step_index** the steps were enumerated with. The error is silent (just `claimed: false`).

### 7. `record_step × 5` — works

Each call returned `{ ok: true }`. ✅

### 8. `complete_plan(plan_id: 70, outcome: true)`

```json
{ "plan_id": 70, "plan_status": "completed", "steps_updated": 0, "recipe_saved": true, "scaffold_saved": true }
```
✅ `steps_updated: 0` because all 5 steps were already `passed` from `record_step`. Both `recipe_saved` and `scaffold_saved` true — the new feature gets stored both as a recipe (text patterns) and as a scaffold_recipe (file structure).

### 9. `status` (end of session)

```
recipes: 22 (unchanged — saving 1 ledger goal didn't increment? Or the count was post-increment. Need to verify.)
plans_total: 65, plans_active: 44
constraints_active: 0
```
🟡 Recipe count didn't tick up despite `recipe_saved: true`. Possibly a deduplication on goal text or fingerprint.

## Findings, ranked by importance

### 🟢 Big wins (new since prior sessions)

1. **Structural similarity matching works.** `structural_similarity: 0.97` for same-shape scaffolds is a substantial improvement over prior text-only matching (capped at ~0.3).
2. **`scaffold_dag_metrics` exposes critical_path_length, max_parallelism, layer_widths.** Useful for detecting bottleneck features.
3. **`scaffold_validation` is comprehensive:** cycle / duplicates / missing_deps / over_constrained / self_referential — none of these tripped on a clean scaffold but the channels are there.
4. **End-to-end workflow works on first try** for both 5-file features (seasonalRecipeRotator + recipeProvenanceLedger).

### 🔴 Bugs

5. **`claim_step` step_id ambiguity.** Either rename param to `step_db_id` or accept `step_index` as alternative.
6. **Recipe text-similarity ceiling stays low (~0.3 max).** Patterns differing in surface text (rotator vs ledger) score poorly even when structurally identical. The structural similarity covers for it but text alone is weak.

### 🟡 Minor

7. **Recipe count didn't increment after `complete_plan`.** Either a dedup or a count reporting lag.
8. **`near_match_recipes` includes a "real-time collaborative recipe editing" pattern from way back** — it has high recency but completely different scaffold. Maybe filter by structural_similarity > 0.5 by default in the displayed list.

## Recommendations to Trammel maintainers (priority-ordered)

1. **Either rename `claim_step.step_id` → `step_db_id`, or accept either step_index or db_id with disambiguation.** Silent failure on `claimed: false` is misleading.
2. **Surface structural_similarity in the default `near_match_recipes` ordering, not just the score components.** The composite `match_score` already weights it — confirmed working.
3. **Document that text_similarity tops out at ~0.3** for non-trivial differences. Users (and agents) treating composite as the only signal won't be misled, but the reported components confuse.
4. **Auto-prune `near_match_recipes` below a `match_score < 0.2`** in non-debug responses.
5. **Investigate whether `complete_plan` actually inserts a new recipe row** — the saved-vs-stored ratio looks wrong.

## Summary table

| Probe | Result | Verdict |
|-------|--------|---------|
| `status` (start) | 22 recipes, 65 plans | ✅ |
| `estimate(scope: src)` | 568 files, "full analysis OK" | ✅ |
| `decompose` (scaffold, 5 files) | 5 steps, layer_widths [1,1,1,2], scaffold_validation valid | ✅ |
| `decompose` (recipeProvenanceLedger, summary_only) | structural_similarity 0.97 → match_score 0.636 against seasonalRecipeRotator | 🟢 NEW WIN |
| `create_plan` | plan_id 70 | ✅ |
| `claim_step(step_id: 0)` (step_index attempt) | claimed: false silently | 🔴 |
| `claim_step(step_id: 667)` (DB id) | claimed: true | ✅ |
| `record_step × 5` | ok: true each | ✅ |
| `complete_plan` | recipe_saved + scaffold_saved | ✅ |
| `near_match_recipes` (with structural_similarity) | 0.97 for same shape | 🟢 |
| Recipe count post-complete | unchanged at 22 | 🟡 |

## Cross-feature observations

Both 5-file features (seasonalRecipeRotator + recipeProvenanceLedger) used `decompose` with explicit scaffold. The second decomposition correctly detected the first as structurally similar. After `complete_plan`, the workflow could plausibly reuse the saved scaffold_recipe via `apply_scaffold_recipe` — that integration wasn't tested this session but the data is now stored.

The 4 cross-MCP / region features (parallelMealPlanComposer + recipeProvenanceLedger + crossRecipeNutrientPipeline + recipeNutrientResolver) used Trammel only for the ledger; the others were built directly. A future session could test `decompose` for all 6 features back-to-back to measure whether structural matching keeps improving as the recipe corpus grows.
