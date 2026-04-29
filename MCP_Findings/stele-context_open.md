# Stele-context MCP — Detailed Report (Review "_open" — fresh session)

**Date:** 2026-04-30
**Project:** RecipeLab_alt
**Stele version:** 1.3.1, Python 3.14.4
**Storage:** `.stele-context/stele_context.db` (190 MB, 12.9 MB WAL)
**Index state at session start:** 831 docs, 4,855 chunks, 62,078 symbol rows
**Index state at session end:** 921 docs, ~63,000 symbol rows, 40,491 edges

## Executive summary

🟢 **Wins:**
- `find_references` is the strongest tool. After re-indexing, returned the correct verdict (`referenced`) for `RecipeProvenanceLedger` with both definitions and references populated, including line numbers.
- `coupling` (semantic) is precise and useful. For `recipeNutrientResolver/index.js` it returned exact partners (`./resolverChain`, `./dynamicNutrientRegistry`, `./nutrientGraph`) with a clean `semantic_score`.
- `index` is fast and reliable: indexed 5 new files (3.9K tokens) in well under a second; supports per-file `summaries` for Tier-2 agent signatures.
- `doctor` gives a useful health snapshot including index_health, db_health, search_quality.

🔴 **Bugs surfaced this session:**
1. **`find_definition` returns 0 results for newly-indexed classes.** Asked for `DynamicNutrientRegistry` immediately after `index` returned `chunks_count: 1` for `dynamicNutrientRegistry.js` — `find_definition` returned `count: 0` with guidance text saying "the symbol may be absent." But `find_references` returned 24 hits including the defining file. The symbol IS in the graph; `find_definition` just fails to surface it.
2. **`find_references` verdict classifier is wrong.** For `ResolverChain` and (initially) `DynamicNutrientRegistry`, the response listed the defining file in `references` but set `verdict: "external"` with `definitions: []`. After re-indexing in a separate call, `find_references("RecipeProvenanceLedger")` did set `verdict: "referenced"` with definitions populated — so the bug is racy or first-call-only.
3. **`agent_grep` exceeds output token limit on common symbol names.** A single call for `DynamicNutrientRegistry` returned 92,488 chars / 270 lines, requiring offset/limit chunked reads. The dedup, scope, and classify features made the per-match payload too rich. No way to cap it via tool param other than `max_tokens` (default 4000) — which it apparently still exceeded.
4. **`coupling` with `significance_threshold > 0` returns 0 partners.** Calling `coupling(crossRecipeNutrientPipeline/index.js, significance_threshold: 0.1)` returned `coupled_files: []`, but the file definitively imports from `recipeNutrientResolver` and `ingredientYieldComputer`. Without threshold, coupling for the same path returns the right partners. So the threshold filter is too aggressive — common symbols like `require` and re-exports get cleared away even when they're real edges.
5. **Tier-2 coverage stuck at 8.61%.** `doctor` reports `tier2_coverage_percent: 8.61` and advises populating semantic_summary on remaining chunks. Without Tier-2, hybrid search defaults to keyword-only as documented but `search` is still degraded.

🟡 **Observations:**
- `editable_install_mismatch`: stele-context is installed editable from `/home/aron/Documents/coding_projects/stele-context` while project root is RecipeLab_alt. `doctor` warns this may cause stale imports — it didn't this session, but the warning persists.
- `index` accepts a `summaries` map as a Tier-2 hint. Using it on the 5 ledger files raised `summaries_applied: 5` — but Tier-2 coverage globally remains 8.61%, so 5 more files barely move the needle.

## Feature built specifically for Stele-context

**`recipeNutrientResolver`** — `src/services/recipeNutrientResolver/`
- `nutrientGraph.js`: NutrientGraph adjacency-list class with `walk` traversal
- `dynamicNutrientRegistry.js`: late-bound resolver registry with alias chain
- `resolverChain.js`: polymorphic dispatch over graph + registry
- `index.js`: facade `createDefaultResolver` + `resolveRecipeNutrients`
- `tests/services/recipeNutrientResolver.test.js`: **19 tests, all passing**

**Why this stresses Stele:** four classes (NutrientGraph, DynamicNutrientRegistry, ResolverChain, plus the SeasonalRecipeRotator-style facade) defined across 4 files with cross-imports. Polymorphic dispatch via `registry.get(name)(ctx)` — symbols are not statically resolvable. Aliases create transitive name resolution that any symbol-graph indexer must follow.

## Live Stele probes (with full results)

### 1. `index` after writes

```
indexed:
  - src/services/recipeNutrientResolver/index.js (1 chunk, 540 tokens)
  - src/services/recipeNutrientResolver/nutrientGraph.js (1 chunk, 309 tokens)
  - src/services/recipeNutrientResolver/dynamicNutrientRegistry.js (1 chunk, 329 tokens)
  - src/services/recipeNutrientResolver/resolverChain.js (1 chunk, 287 tokens)
  - tests/services/recipeNutrientResolver.test.js (1 chunk, 1440 tokens)
total_chunks: 5, summaries_applied: 5
```
✅ Fast, reliable. Summaries accepted.

### 2. `find_definition("DynamicNutrientRegistry")` — IMMEDIATELY after index

```json
{
  "definitions": [],
  "count": 0,
  "symbol_index": { "status": "ready", "indexed_documents": 836, "symbol_row_count": 62425 },
  "guidance": "The symbol graph is populated but this name has no matches..."
}
```
🔴 **WRONG.** The class is defined at line 8 of `dynamicNutrientRegistry.js`, just-indexed. `count: 0` is not justifiable — `find_references` for the same name returned 24 hits including the defining file.

### 3. `find_references("ResolverChain")` — verdict bug

```json
{
  "symbol": "ResolverChain",
  "verdict": "external",
  "definitions": [],
  "references": [
    { "kind": "import",  "document_path": "src/services/recipeNutrientResolver/index.js",         "line_number": 9 },
    { "kind": "function","document_path": "src/services/recipeNutrientResolver/index.js",         "line_number": 34 },
    { "kind": "class",   "document_path": "src/services/recipeNutrientResolver/index.js",         "line_number": 34 },
    { "kind": "variable","document_path": "src/services/recipeNutrientResolver/resolverChain.js", "line_number": 41 },
    { "kind": "function","document_path": "tests/services/recipeNutrientResolver.test.js",        "line_number": 115 },
    { "kind": "class",   "document_path": "tests/services/recipeNutrientResolver.test.js",        "line_number": 115 },
    ...
  ],
  "total": 7
}
```
🔴 **`verdict: "external"`** even though `resolverChain.js` is included in references AND the class is defined in this project. `definitions: []` is empty even though one of the references is `kind: "variable"` at line 41 of the defining file (the `module.exports`). Verdict logic confused defining-file-listed-only-in-references with external.

### 4. `find_references("DynamicNutrientRegistry")` — same bug, 24 hits

Identical pattern: `verdict: "external"`, `definitions: []`, but references include line 59 of `dynamicNutrientRegistry.js` (the `module.exports`).

### 5. `find_references("RecipeProvenanceLedger")` — works (after re-indexing)

```json
{
  "symbol": "RecipeProvenanceLedger",
  "verdict": "referenced",
  "definitions": [
    { "kind": "class",
      "document_path": "src/services/recipeProvenanceLedger/index.js",
      "line_number": 7 }
  ],
  "references": [...],
  "total": 15
}
```
✅ Verdict correctly `referenced`, definitions populated. So the bug above (verdict=`external` despite definition in project) is **not deterministic**. After indexing 5 more files, the next `find_references` call worked. Possibly a stale-index race.

### 6. `coupling("recipeNutrientResolver/index.js")` — works

13 partners returned, semantic_score ranked:
- `resolverChain.js`: 2.0 (depends_on, shared `./resolverChain` + `resolveAll`)
- `dynamicNutrientRegistry.js`: 1.61 (depends_on, 3 shared symbols)
- `tests/services/recipeNutrientResolver.test.js`: 1.0 (depended_on_by)
- `nutrientGraph.js`: 1.0 (depends_on)
- ... noise tail of unrelated files sharing `registry`/`graph`/`chain` names with `semantic_score` 0.15–0.22 (correctly low)

✅ Direction (depends_on / depended_on_by) correct. Tail noise correctly de-ranked.

### 7. `coupling(...crossRecipeNutrientPipeline/index.js, significance_threshold: 0.1)` — returns []

🔴 With threshold filter, returns 0 partners. The file imports `normalizer` and `aggregator` (sibling) plus `recipeNutrientResolver` and `ingredientYieldComputer` — at least 4 real edges. Threshold filtering removes them all.

### 8. `agent_grep("DynamicNutrientRegistry")` — over token limit

92,488 chars / 270 lines result. Tool returned an error with a path to a saved file. Default `max_tokens: 4000` was apparently overrun by the rich per-match payload (scope, classification, content_preview each match).

### 9. `doctor` — health snapshot

```
documents: 921, chunks: 4855+
db: WAL 12.9 MB, autocheckpoint=1000, busy_timeout=30s
search_quality: tier2_coverage_percent=8.61, hnsw_span=0.0216
environment.issues: editable_install_mismatch (chisel, chisel-test-impact, coordinationhub, trammel, stele-context, cobol-safe-translator)
```

## Findings, ranked by importance

### 🔴 Critical bugs

1. **`find_definition` returns 0 even when symbol is in graph.** Sometimes — not deterministic. Worked for some symbols, failed for others indexed in the same `index` call.
2. **`find_references` verdict classifier is wrong / racy.** Returns `verdict: "external"` while listing the defining file in `references`. `definitions` array is empty when it shouldn't be. After enough indexing churn the same call returns `verdict: "referenced"`.
3. **`coupling significance_threshold` filter is over-aggressive.** Setting `significance_threshold: 0.1` collapses real coupling edges to 0. Default (0.0) returns the correct ~13 partners with a noisy long tail. Threshold tuning is a footgun.
4. **`agent_grep` ignores `max_tokens` for common symbols.** Default 4000 was massively exceeded; output saved to disk file requiring chunked reads.

### 🟡 Quality / coverage gaps

5. **Tier-2 coverage stuck at 8.61%** — the doctor's own advice. Without Tier-2 summaries on >80% of chunks, semantic search is structurally degraded. The `summaries` parameter on `index` is the prescribed fix but not auto-applied.
6. **`editable_install_mismatch`** — Stele is installed editable from a sibling project. `doctor` warns. Hasn't broken anything yet but is a known hazard.

### 🟢 Strengths confirmed

7. **`index` is fast and reliable.** Stable across 30+ calls.
8. **`coupling` (default threshold) returns precise import partners with direction and shared symbols.** Best Stele tool for "what files need to change together."
9. **`find_references` (when verdict is right) is the LSP-style killer feature.** Returns kind classification (variable/import/function/class), line numbers, content_preview.
10. **`doctor` is a great single-pane snapshot.**

## Recommendations to Stele-context maintainers (priority-ordered)

1. **Fix `find_definition` 0-result bug.** Same chunk that has the symbol shows 24 references but 0 definitions. Likely a write-after-read ordering bug between symbol_graph and chunk_store.
2. **Fix `find_references` verdict classifier.** Verdict should be `referenced` whenever any reference's document_path matches a chunk that contains the symbol's definition. Right now it appears to require the definition to also be in `definitions[]` — circular.
3. **Cap `agent_grep` output by row count, not just tokens.** Or auto-paginate when exceeding 4000 tokens. The disk-file fallback is a usability cliff.
4. **Re-tune `significance_threshold` default.** A threshold of 0.1 zeroing all partners means common symbol names dominate the discount. Either filter by a denylist of generic names (`require`, `module`, `exports`, `push`, `has`) or use IDF-style weighting on shared symbols.
5. **Auto-populate Tier-2 summaries during `index`.** Without summaries, `search` (hybrid) effectively runs in keyword mode forever. Optional `auto_summarize: true` flag would help.
6. **Document the `editable_install_mismatch` recovery procedure** — `pip install -e .` from RecipeLab_alt or a sentinel that detects "this is the wrong project root."

## Summary table

| Probe | Result | Verdict |
|-------|--------|---------|
| `index` (5 files, with summaries) | indexed 5 chunks, 0 errors | ✅ |
| `find_definition("DynamicNutrientRegistry")` | count: 0 (wrong) | 🔴 |
| `find_references("ResolverChain")` | verdict=external, definitions=[] (wrong, but 7 refs returned) | 🔴 |
| `find_references("DynamicNutrientRegistry")` | verdict=external, 24 refs (wrong verdict) | 🔴 |
| `find_references("RecipeProvenanceLedger")` | verdict=referenced, 15 refs, definitions populated | ✅ |
| `coupling("recipeNutrientResolver/index.js")` (default) | 13 partners, semantic_score correct | ✅ |
| `coupling(..., significance_threshold: 0.1)` | 0 partners (over-filter) | 🔴 |
| `agent_grep("DynamicNutrientRegistry")` | 92K chars, output limit exceeded | 🔴 |
| `doctor` | full snapshot, tier2=8.61% | 🟡 |

## Cross-feature observations

The 6-feature build exercised Stele on:
- 4 new packages (recipeNutrientResolver, parallelMealPlanComposer, recipeProvenanceLedger, crossRecipeNutrientPipeline) — all indexed cleanly.
- 1 modified file (`recipeScalingService.js` add 1 require) — `detect_changes` not invoked but would have flagged it.
- 0 new files indexed via `working_tree=true` (preferred path was explicit `index` after writes).

`find_references` was used for verification of cross-feature symbol resolution (e.g. `RecipeProvenanceLedger` → tests). When verdict is correct, the tool is exactly what you want for a multi-file refactor's pre-flight check.
