# Chisel MCP — Detailed Report (Review "_open" — fresh session)

**Date:** 2026-04-30
**Project:** RecipeLab_alt
**Storage:** `.chisel/chisel.db`

## Executive summary

🔴 **Most-severe finding this session: Chisel's analysis pipeline is partially broken.**

- `analyze` reports `code_units_found: 0` while scanning 731 files. Code-unit extraction is dead.
- `update` reports `files_updated: 0` even when `new_commits: 1` (it sees the commit but doesn't process it).
- `diff_impact` returns the **same massive `stale_db` list of ~400 "changed" files regardless of `ref` argument** — it's hallucinating that the entire repo changed. The fingerprint of `changed_files` is identical for `HEAD` and `HEAD~1`.
- `suggest_tests` always falls back to `source: "fallback"` (stem-matching). It never returns `direct`/`hybrid`/`import_graph` matches even after committing source+test that directly require each other. The DB test_edge graph (50,294 edges) appears to be a stale legacy and not actually consulted by the tool.
- `missing_from_db: ["src/db/sqlite.js"]` — DB references a file that no longer exists; Chisel never noticed it was deleted.

🟢 **Wins (still working):**
- `triage` produced a useful top-N risk + gaps + stale-tests report.
- `risk_map` ranks correctly (highest-risk = `tests/challengeFeatures/challengeFeatures.test.js` at 1.0). Composite breakdown shows `coupling=1.0`, `coverage_gap=1.0`, `author_concentration=1.0` — real signals.
- `test_gaps` with `working_tree: true` correctly enumerated the 8 untested functions in our new `ingredientYieldComputer.js` plus the 4 classes/funcs in `recipeNutrientResolver/`.
- `record_result` accepts test outcomes and confirms `recorded: true`.
- `stats` returns trustworthy DB summary counts.
- `coupling` returns the documented 0.0 import_coupling for solo projects (known issue, not new).

## Feature built specifically for Chisel

**`ingredientYieldComputer`** — `src/utils/ingredientYieldComputer.js`

5 pure functions: `clampFactor`, `scaleQuantity`, `roundToFractional`, `effectiveYield`, `applyYieldLoss`. All exercised by direct unit tests (`tests/utils/ingredientYieldComputer.test.js`, **16 tests**) and indirectly via `recipeScalingService.js` (which now requires three of the five). The chain is:

```
src/utils/ingredientYieldComputer.js                  (NEW util)
  ←  src/services/recipeScalingService.js              (imports clampFactor, scaleQuantity, effectiveYield)
       ←  src/api/routes/scalingRoutes.js              (imports recipeScalingService)
            ←  src/models/Recipe.js                    (used at instantiation)
                 ←  tests/models/recipe.test.js        (covers Recipe directly)
                 ←  tests/api/recipes.test.js          (covers route → recipe → scaling)
```

**Why this stresses Chisel:** a transitive 4-hop chain. Modifying `ingredientYieldComputer.js` should ripple to recipe/scaling/route tests via `diff_impact`. **It didn't.** Even after committing the change, `diff_impact` listed all ~400 files in `changed_files` with `status: stale_db`, never resolving the actual transitive impact.

## Live Chisel probes (with full results)

### 1. `stats` (start of session)

```
code_units: 4704
test_units: 3305
test_edges: 83689
import_edges: 903
co_changes: 66
shadow_graph: { call_edges: 50664, import_edges: 33025, dynamic_import_edges: 0 }
```

After analyze: `code_units: 4704` (unchanged), `test_edges: 50294` — actually **dropped by 33K** after the analyze call.

### 2. `analyze` — code_units extraction broken

```json
{
  "code_files_scanned": 731,
  "code_units_found": 0,
  "test_files_found": 160,
  "test_units_found": 3314,
  "test_edges_built": 50381,
  "commits_parsed": 5
}
```
🔴 **`code_units_found: 0` despite scanning 731 files.** Stats afterward still report `code_units: 4704` — meaning prior code units survived but no new ones were extracted. Either the JS parser silently fails or analysis is skipping the source step.

### 3. `update` — incremental update is a no-op

Two consecutive calls:
- Before commit: `files_updated: 0, code_units_found: 0, new_commits: 0`
- After committing a 5-file feature: `files_updated: 0, code_units_found: 0, new_commits: 1`

🔴 **It sees the commit (`new_commits: 1`) but doesn't process the files in it.** The whole point of `update` is incremental processing — it's broken.

### 4. `diff_impact` — useless

```json
{
  "status": "stale_db",
  "changed_files": [ ... ~400 files, basically every JS file in src/ + tests/ ... ],
  "missing_from_db": ["src/db/sqlite.js"],
  "message": "Some changed files are missing from the analysis database.",
  "hint": "Run 'chisel update' first to include new or changed files."
}
```

🔴 **Identical output for `ref: HEAD` and `ref: HEAD~1`** — the tool can't actually scope to a diff. It's claiming the entire repo changed.

🔴 **`missing_from_db: ["src/db/sqlite.js"]`** — that file was deleted commits ago. Chisel never reaped the row.

🔴 **The `hint` "Run 'chisel update' first"** is a dead end because `update` itself returns 0.

### 5. `suggest_tests` — always falls back

For `src/utils/ingredientYieldComputer.js` (committed):
```
[
  { source: "fallback", reason: "fallback: stem-matched test file", relevance: 0.8, ...16 entries... },
  { source: "fallback", reason: "fallback: stem-matched test file", relevance: 0.4, ...4 noise entries... }
]
```
🔴 **Source is `"fallback"`, not `direct`/`hybrid`/`import_graph`.** Even though `tests/utils/ingredientYieldComputer.test.js` directly `require()`s the source. The test_edge graph claims 50K+ edges but `suggest_tests` ignores them and stem-matches by filename instead. With or without `working_tree=true`, same result.

### 6. `test_gaps` (working_tree=true) — works

Correctly enumerated:
- `ingredientYieldComputer.js`: 5 functions (`clampFactor`, `scaleQuantity`, `roundToFractional`, `effectiveYield`, `applyYieldLoss`) — all `churn_score: 0`, `commit_count: 0`
- `recipeNutrientResolver/`: `NutrientGraph`, `DynamicNutrientRegistry`, `ResolverChain`, `createDefaultResolver`, `resolveRecipeNutrients`

✅ **Working tree mode works** — newly-created files appear with `_working_tree: true` flag.

### 7. `risk_map` / `triage` — works

Top-5 from `triage(top_n: 5, working_tree: true)`:

| File | Risk | Top breakdown |
|------|------|---------------|
| `tests/challengeFeatures/challengeFeatures.test.js` | 1.0 | coupling=1.0, coverage_gap=1.0, author_concentration=1.0, new_file_boost=0.5 |
| `src/services/bowTieImportTopology/hub.js` | 0.987 | coupling=1.0, coverage_gap=0.91 |
| `src/api/routes/eventSourcingRoutes.js` | 0.982 | coupling=1.0, coverage_gap=0.88 |
| `src/api/routes/mcpChallengeRoutes.js` | 0.982 | similar |
| `src/api/routes/optPipelineRoutes.js` | 0.982 | similar |

✅ Composite signal works. Note `cochange_coupling=0.0` everywhere — solo project, expected.

### 8. `record_result` — works

6 test_id results recorded successfully (one per new test file). Verified via `next_steps` returning `re-rank test suggestions`. ✅

### 9. `coupling("recipeScalingService.js")` — known broken

Not invoked this session. From prior sessions: returns 0.0 for solo projects regardless of threshold. Documented limitation.

## Findings, ranked by importance

### 🔴 Critical — broken pipeline

1. **`analyze` extracts 0 code_units.** The most fundamental pipeline step is dead. All downstream tools (`suggest_tests`, `diff_impact`, `coupling`) are starved of the very data they query.
2. **`update` no-ops on new commits.** `new_commits: 1, files_updated: 0` is contradictory; the tool sees the commit but processes none of its files. This breaks the entire incremental workflow.
3. **`diff_impact` is hallucinating.** Returns `~400 files changed` for both HEAD and HEAD~1, identical. Untrustworthy until fixed.
4. **`suggest_tests` ignores the test_edge graph.** 50K test_edges in DB, but the tool returns only `source: "fallback"` (stem matching). The graph and the tool are disconnected.

### 🟡 Stale data

5. **`missing_from_db: ["src/db/sqlite.js"]`** — Chisel retains rows for files long deleted from the working tree. No GC.

### 🟢 Working

6. `triage` / `risk_map` / `test_gaps` / `record_result` / `stats` / `churn` all work as documented.
7. `working_tree: true` correctly surfaces uncommitted/new files in `risk_map` and `test_gaps`.

## Recommendations to Chisel maintainers (priority-ordered)

1. **Diagnose why `analyze` returns 0 code units** despite scanning 731 files. The JS parser/AST extractor is the obvious suspect. Add a `--debug` mode that prints per-file `extracted_units` to surface this in the field.
2. **Fix `update` to actually process new-commit files.** `new_commits: 1, files_updated: 0` should be impossible.
3. **Make `diff_impact` honor `ref`.** Currently returns identical output for any ref — clearly the diff is being computed against a hardcoded baseline (likely the start of the chisel db's commit log).
4. **Wire `suggest_tests` to actually consult `test_edges`.** With 50K+ edges in the DB, fallback mode should never be the only source.
5. **GC deleted-file rows from the DB.** `missing_from_db` for files that don't exist anywhere is just stale state.
6. **Add a self-consistency check in `doctor`.** "code_files_scanned: 731 but code_units in DB: 4704 → likely stale" would have surfaced this immediately.

## Summary table

| Probe | Result | Verdict |
|-------|--------|---------|
| `stats` | 4704 code_units, 50K test_edges | ✅ |
| `analyze` | 731 files scanned, 0 code_units found | 🔴 |
| `update` | 0 files_updated despite 1 new commit | 🔴 |
| `diff_impact` (HEAD or HEAD~1) | identical ~400 file `stale_db` list | 🔴 |
| `suggest_tests` (committed util) | only `source: "fallback"` results | 🔴 |
| `test_gaps` (working_tree=true) | correctly enumerates 8+ new units | ✅ |
| `triage` (top_n=5) | clean composite ranking | ✅ |
| `risk_map` | composite weights work | ✅ |
| `record_result` | recorded: true × 6 | ✅ |
| `churn` (new file) | 0 (expected) | ✅ |

## Cross-feature observations

The 6 features added 9 source files + 6 test files (excluding the 1 modified `recipeScalingService.js`). With Chisel's `analyze` producing 0 code units and `suggest_tests` falling back to stem matching, **none of Chisel's claimed differentiators (transitive impact, suggest_tests via test_edge graph, diff_impact scoping)** were observable in this session. The tools that worked (`risk_map`, `test_gaps`, `triage`, `record_result`) are valuable but represent a fraction of Chisel's advertised capability.

The intended cascading test impact (`ingredientYieldComputer.js → recipeScalingService.js → scalingRoutes.js → tests/api/recipes.test.js`) was specifically designed to exercise `diff_impact`. The tool failed to detect any transitive impact and instead claimed the entire codebase changed.
