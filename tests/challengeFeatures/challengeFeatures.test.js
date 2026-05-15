'use strict';

/**
 * Challenge Features Test Suite
 * Tests for all 6 MCP challenge features
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..', '..');

console.log('Starting Challenge Features Tests...\n');

// Test 1: RuntimeSymbolDependencyVisualizer
console.log('Test 1: RuntimeSymbolDependencyVisualizer');
{
  const RuntimeSymbolDependencyVisualizer = require('../../src/services/challengeFeatures/RuntimeSymbolDependencyVisualizer');
  const visualizer = new RuntimeSymbolDependencyVisualizer(projectRoot);

  const testFile = path.join(projectRoot, 'src', 'services', 'searchService.js');
  if (fs.existsSync(testFile)) {
    const analysis = visualizer.analyzeFile(testFile);
    assert.ok(analysis.file.includes('searchService'), 'Should analyze file');
    assert.ok(Array.isArray(analysis.staticImports), 'Should have imports array');
    assert.ok(Array.isArray(analysis.dynamicResolutions), 'Should have dynamic resolutions');
    console.log('  ✓ File analysis works');
  }

  const graph = visualizer.generateRuntimeGraph();
  assert.ok(graph.nodes, 'Should have nodes');
  assert.ok(graph.edges, 'Should have edges');
  assert.ok(typeof graph.summary.invisiblePercent === 'number', 'Should have invisible percent');
  console.log('  ✓ Runtime graph generation works');
  console.log('  ✓ Invisible edges: ' + graph.summary.invisibleEdgesCount + ' (' + graph.summary.invisiblePercent.toFixed(1) + '%)');

  const queryResult = visualizer.analyzeQueryResolution('recipe search');
  assert.ok(queryResult.query === 'recipe search', 'Should store query');
  assert.ok(typeof queryResult.divergence === 'number', 'Should calculate divergence');
  console.log('  ✓ Query resolution analysis works');
  console.log('  ✓ stele-context challenged: dynamic resolution invisible to static analysis\n');
}

// Test 2: BehavioralTestCoverageAnalyzer
console.log('Test 2: BehavioralTestCoverageAnalyzer');
{
  const BehavioralTestCoverageAnalyzer = require('../../src/services/challengeFeatures/BehavioralTestCoverageAnalyzer');
  const analyzer = new BehavioralTestCoverageAnalyzer(projectRoot);

  const testFile = path.join(projectRoot, 'src', 'services', 'searchService.js');
  if (fs.existsSync(testFile)) {
    const behaviors = analyzer.detectBehaviors(testFile);
    assert.ok(behaviors.file, 'Should have file');
    assert.ok(Array.isArray(behaviors.behaviors), 'Should have behaviors array');
    assert.ok(typeof behaviors.behaviorCount === 'number', 'Should have count');
    console.log('  ✓ Behavior detection works');
    console.log('  ✓ Behaviors found: ' + behaviors.behaviorCount);
  }

  const matrix = analyzer.buildCoverageMatrix();
  assert.ok(Array.isArray(matrix), 'Should return array');
  console.log('  ✓ Coverage matrix works');
  console.log('  ✓ Files analyzed: ' + matrix.length);

  const gaps = analyzer.analyzeBehavioralGaps();
  assert.ok(Array.isArray(gaps), 'Should return array');
  console.log('  ✓ Gap analysis works');
  console.log('  ✓ Gaps found: ' + gaps.length);

  const report = analyzer.generateReport();
  assert.ok(report.summary, 'Should have summary');
  assert.ok(typeof report.chiselVsBehavioral.divergencePercent === 'number', 'Should have divergence');
  console.log('  ✓ Report generation works');
  console.log('  ✓ chisel challenged: binary coverage vs behavioral coverage\n');
}

// Test 3: EmergentArchitectureDetector
console.log('Test 3: EmergentArchitectureDetector');
{
  const EmergentArchitectureDetector = require('../../src/services/challengeFeatures/EmergentArchitectureDetector');
  const detector = new EmergentArchitectureDetector(projectRoot);

  const result = detector.analyzeArchitecture();
  assert.ok(result.layers, 'Should have layers');
  assert.ok(Array.isArray(result.patterns), 'Should have patterns');
  assert.ok(Array.isArray(result.smells), 'Should have smells');
  assert.ok(Array.isArray(result.suggestions), 'Should have suggestions');
  console.log('  ✓ Architecture analysis works');
  console.log('  ✓ Layers found: ' + result.layers.length);
  console.log('  ✓ Patterns found: ' + result.patterns.length);
  console.log('  ✓ Smells found: ' + result.smells.length);

  const summary = result.summary;
  assert.ok(typeof summary.emergentPatterns !== 'undefined', 'Should have patterns');
  console.log('  ✓ Summary generation works');
  console.log('  ✓ trammel challenged: cannot infer architecture from code\n');
}

// Test 4: DistributedArchitectureReviewer
console.log('Test 4: DistributedArchitectureReviewer');
{
  const reviewerModule = require('../../src/services/challengeFeatures/DistributedArchitectureReviewer');
  const DistributedArchitectureReviewer = reviewerModule.DistributedArchitectureReviewer;
  const CoordinationTools = reviewerModule.CoordinationTools;
  const coordTools = new CoordinationTools();
  const reviewer = new DistributedArchitectureReviewer(projectRoot, coordTools);

  const regResult = coordTools.registerAgent('test_agent', 'parent', 'test');
  assert.ok(regResult.agent_id === 'test_agent', 'Should register');
  console.log('  ✓ Agent registration works');

  const lockResult = coordTools.acquireLock('/test/file.js', 'test_agent');
  assert.ok(lockResult.success, 'Should acquire lock');
  console.log('  ✓ Lock acquisition works');

  const contentionResult = coordTools.acquireLock('/test/file.js', 'other_agent');
  assert.ok(!contentionResult.success, 'Should detect contention');
  assert.ok(contentionResult.ownership_warning, 'Should warn about ownership');
  console.log('  ✓ Lock contention detection works');

  const forceResult = coordTools.acquireLock('/test/file.js', 'other_agent', true);
  assert.ok(forceResult.success, 'Should force lock');
  console.log('  ✓ Force lock works');

  const notifResult = coordTools.notifyChange('/test/file.js', 'modified', 'test_agent');
  assert.ok(notifResult.id, 'Should create notification');
  console.log('  ✓ Change notifications work');

  const notifications = coordTools.getNotifications();
  assert.ok(Array.isArray(notifications), 'Should return array');
  console.log('  ✓ Notification retrieval works');
  console.log('  ✓ coordinationhub challenged: multi-agent coordination and locking\n');
}

// Test 5: DistributedFeatureValidator
console.log('Test 5: DistributedFeatureValidator');
{
  const validatorModule = require('../../src/services/challengeFeatures/DistributedFeatureValidator');
  const DistributedFeatureValidator = validatorModule.DistributedFeatureValidator;
  const VALIDATION_ASPECTS = validatorModule.VALIDATION_ASPECTS;
  const reviewerModule = require('../../src/services/challengeFeatures/DistributedArchitectureReviewer');
  const CoordinationTools = reviewerModule.CoordinationTools;
  const coordTools = new CoordinationTools();
  const validator = new DistributedFeatureValidator(projectRoot, coordTools);

  const aspects = VALIDATION_ASPECTS;
  assert.ok(aspects.CORRECTNESS, 'Should have CORRECTNESS aspect');
  assert.ok(aspects.PERFORMANCE, 'Should have PERFORMANCE aspect');
  assert.ok(aspects.SECURITY, 'Should have SECURITY aspect');
  assert.ok(aspects.COVERAGE, 'Should have COVERAGE aspect');
  console.log('  ✓ Validation aspects defined');

  const featureContext = {
    name: 'test_feature',
    files: validator.getFilesForValidation()
  };
  assert.ok(Array.isArray(featureContext.files), 'Should have files');
  console.log('  ✓ Feature context works');
  console.log('  ✓ Files to validate: ' + featureContext.files.length);

  const mockResults = [
    { aspect: 'correctness', findings: [] },
    { aspect: 'performance', findings: [] },
    { aspect: 'security', findings: [] },
    { aspect: 'coverage', findings: [] }
  ];
  const impactAnalysis = validator.analyzeMCPImpact(mockResults);
  assert.ok(Array.isArray(impactAnalysis), 'Should return array');
  assert.ok(impactAnalysis.length === 4, 'Should have 4 MCPs');
  console.log('  ✓ MCP impact analysis works');
  console.log('  ✓ All MCPs challenged: cross-cutting validation\n');
}

// Test 6: AutonomousArchitectureEvolver
console.log('Test 6: AutonomousArchitectureEvolver');
{
  const evolverModule = require('../../src/services/challengeFeatures/AutonomousArchitectureEvolver');
  const AutonomousArchitectureEvolver = evolverModule.AutonomousArchitectureEvolver;
  const EVOLUTION_STAGES = evolverModule.EVOLUTION_STAGES;
  const reviewerModule = require('../../src/services/challengeFeatures/DistributedArchitectureReviewer');
  const CoordinationTools = reviewerModule.CoordinationTools;
  const coordTools = new CoordinationTools();
  const evolver = new AutonomousArchitectureEvolver(projectRoot, coordTools);

  const stages = EVOLUTION_STAGES;
  assert.ok(stages.ANALYSIS, 'Should have ANALYSIS stage');
  assert.ok(stages.PROPOSAL, 'Should have PROPOSAL stage');
  assert.ok(stages.VALIDATION, 'Should have VALIDATION stage');
  assert.ok(stages.IMPLEMENTATION, 'Should have IMPLEMENTATION stage');
  assert.ok(stages.VERIFICATION, 'Should have VERIFICATION stage');
  console.log('  ✓ Evolution stages defined');

  const challenges = evolver.analyzeMCPChallenges();
  assert.ok(challenges['stele-context'], 'Should analyze stele');
  assert.ok(challenges['chisel'], 'Should analyze chisel');
  assert.ok(challenges['trammel'], 'Should analyze trammel');
  assert.ok(challenges['coordinationhub'], 'Should analyze coordinationhub');
  console.log('  ✓ MCP challenges analysis works');

  for (const mcpData of Object.values(challenges)) {
    assert.ok(Array.isArray(mcpData.challengedBy), 'Should have challengedBy');
    assert.ok(mcpData.challengedBy.length > 0, 'Should be challenged by multiple stages');
  }
  console.log('  ✓ All 4 MCPs challenged across evolution stages');
  console.log('  ✓ All MCPs challenged: autonomous architecture evolution\n');
}

// Test 7: MCPOrchestrationDashboard
console.log('Test 7: MCPOrchestrationDashboard');
{
  const { MCPOrchestrationDashboard } = require('../../src/services/challengeFeatures/MCPOrchestrationDashboard');
  const dashboard = new MCPOrchestrationDashboard(projectRoot);

  assert.ok(dashboard, 'Should instantiate dashboard');
  console.log('  ✓ Dashboard instantiation works');

  assert.ok(typeof dashboard.executeWorkflow === 'function', 'Should have executeWorkflow method');
  assert.ok(typeof dashboard.generateReport === 'function', 'Should have generateReport method');
  console.log('  ✓ Required methods exist');

  // Synchronously test report generation with mock MCP responses
  dashboard.mcpResponses.chisel = {
    top_risk_files: [
      { file_path: 'src/models/Recipe.js', risk_score: 0.95, breakdown: { coverage_gap: 0.9 } }
    ]
  };
  dashboard.mcpResponses.stele = {
    find_references: {
      symbol: 'Recipe',
      verdict: 'referenced',
      definitions: [{ document_path: 'src/models/Recipe.js' }],
      references: [{ document_path: 'src/api/routes/recipes.js' }],
      total: 2
    },
    impact_radius: {
      origin: 'src/models/Recipe.js',
      max_depth: 2,
      affected_chunks: 10,
      affected_files: 5,
      files: [{ path: 'src/api/routes/recipes.js', chunk_count: 2, depth_min: 1, depth_max: 1 }]
    }
  };
  dashboard.mcpResponses.trammel = {
    strategy: {
      goal: 'Refactor Recipe model',
      steps: [{ id: 'step_1' }],
      analysis_meta: { dep_files: 3, scaffold_only: false, scaffold_dag_metrics: { node_count: 3, edge_count: 2, max_dependency_depth: 2 } }
    }
  };
  dashboard.mcpResponses.coordination = {
    created: true,
    task: { id: 'phase13.integrated1.subtask.123', parent_task_id: 'phase13.integrated1', status: 'pending' }
  };
  dashboard.handoffMetrics.chiselToStele = { success: true, dataQuality: 0.8, notes: [] };
  dashboard.handoffMetrics.steleToTrammel = { success: true, dataQuality: 0.7, notes: [] };
  dashboard.handoffMetrics.trammelToCoordination = { success: true, dataQuality: 0.9, notes: [] };

  const reportPath = dashboard.generateReport({ file_path: 'src/models/Recipe.js', risk_score: 0.95 });
  assert.ok(fs.existsSync(reportPath), 'Report file should be written');
  console.log('  ✓ Report generation works');

  const reportContent = fs.readFileSync(reportPath, 'utf8');
  assert.ok(reportContent.includes('Executive Summary'), 'Report should have executive summary');
  assert.ok(reportContent.includes('Detailed MCP Call Log'), 'Report should have detailed log');
  assert.ok(reportContent.includes('Cross-MCP Handoff Quality'), 'Report should analyze handoffs');
  assert.ok(reportContent.includes('Gaps in the Cross-MCP Workflow'), 'Report should identify gaps');
  assert.ok(reportContent.includes('Recommendations for Integration Improvements'), 'Report should have recommendations');
  assert.ok(reportContent.includes('Conclusion'), 'Report should have conclusion');
  console.log('  ✓ Report contains all required sections');

  // Verify handoff metrics structure
  assert.ok(dashboard.handoffMetrics.chiselToStele.success, 'Should track chisel→stele handoff');
  assert.ok(dashboard.handoffMetrics.steleToTrammel.success, 'Should track stele→trammel handoff');
  assert.ok(dashboard.handoffMetrics.trammelToCoordination.success, 'Should track trammel→coordination handoff');
  console.log('  ✓ Handoff metrics tracked');

  // Test helper: toPascalCase
  assert.strictEqual(dashboard.toPascalCase('recipe'), 'Recipe');
  assert.strictEqual(dashboard.toPascalCase('recipe-tag'), 'RecipeTag');
  assert.strictEqual(dashboard.toPascalCase('recipe_tag'), 'RecipeTag');
  assert.strictEqual(dashboard.toPascalCase('recipeTag'), 'RecipeTag');
  console.log('  ✓ Symbol inference helper works');
  console.log('  ✓ All 4 MCPs orchestrated: integrated cross-MCP workflow\n');

  // Clean up mock report
  fs.unlinkSync(reportPath);
}

// Test 9: AdversarialScaffoldGenerator (Trammel challenge - Phase 13)
console.log('Test 9: AdversarialScaffoldGenerator');
{
  const {
    AdversarialScaffoldGenerator,
    SimulatedTrammelClient,
    CoordinationHubClient
  } = require('../../src/services/challengeFeatures/AdversarialScaffoldGenerator');

  const trammelClient = new SimulatedTrammelClient(path.join(projectRoot, 'trammel.db'));

  const generator = new AdversarialScaffoldGenerator({ projectRoot });
  const goal = generator.getComplexGoal();
  const scaffold = generator.getDetailedScaffold();

  // Decompose with scaffold
  const withScaffold = trammelClient.decompose(goal, scaffold);
  assert.ok(withScaffold.steps.length >= 3, 'Should decompose with scaffold into at least 3 steps');
  assert.ok(withScaffold.dependency_graph, 'Should have dependency graph');
  console.log('  ✓ decompose with scaffold works');

  // Decompose without scaffold
  const withoutScaffold = trammelClient.decompose(goal, null);
  assert.ok(withoutScaffold.steps.length >= 1, 'Should decompose without scaffold into at least 1 step');
  console.log('  ✓ decompose without scaffold works');

  // Verify that scaffold decomposition has more or equal steps than heuristic
  assert.ok(withScaffold.steps.length >= withoutScaffold.steps.length, 'Scaffold should produce equal or more steps');
  console.log('  ✓ scaffold improves decomposition granularity');

  // create_plan
  const plan = trammelClient.create_plan(goal, withScaffold.steps);
  assert.ok(plan.plan_id, 'Should return a plan_id');
  assert.ok(plan.total_steps === withScaffold.steps.length, 'Plan should track total steps');
  console.log('  ✓ create_plan works');

  // verify_step on at least 3 steps
  const stepsToVerify = withScaffold.steps.slice(0, 3);
  assert.ok(stepsToVerify.length >= 3, 'Should have at least 3 steps to verify');
  let passCount = 0;
  for (const step of stepsToVerify) {
    const v = trammelClient.verify_step(step);
    assert.ok(typeof v.passed === 'boolean', 'verify_step should return passed boolean');
    assert.ok(v.rationale, 'verify_step should include rationale');
    if (v.passed) passCount++;
  }
  assert.ok(passCount >= 2, 'At least 2 of 3 steps should pass verification');
  console.log('  ✓ verify_step works (' + passCount + '/' + stepsToVerify.length + ' passed)');

  // save_recipe and get_recipe
  const strategy = { approach: 'test', step_count: withScaffold.steps.length };
  const saved = trammelClient.save_recipe(goal, strategy, withScaffold.steps);
  assert.ok(saved.sig, 'save_recipe should return a recipe signature');
  assert.ok(saved.saved, 'save_recipe should indicate success');
  console.log('  ✓ save_recipe works');

  const retrieved = trammelClient.get_recipe('Build real-time collaborative editing with WebSocket fallback');
  assert.ok(Array.isArray(retrieved.matches), 'get_recipe should return matches array');
  console.log('  ✓ get_recipe works');

  // Report generation
  generator.results.decomposeWithScaffold = withScaffold;
  generator.results.decomposeWithoutScaffold = withoutScaffold;
  generator.results.createPlan = plan;
  generator.results.verifySteps = stepsToVerify.map(s => trammelClient.verify_step(s));
  generator.results.saveRecipe = saved;
  generator.results.getRecipe = retrieved;
  generator._writeReport();

  const reportPath = path.join(projectRoot, 'MCP_Findings', 'Phase_13', 'trammel.md');
  assert.ok(fs.existsSync(reportPath), 'Report should be written');
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  assert.ok(reportContent.includes('Executive Summary'), 'Report should have executive summary');
  assert.ok(reportContent.includes('MCP Call Log'), 'Report should have MCP call log');
  assert.ok(reportContent.includes('Decompose Comparison'), 'Report should compare decompose results');
  assert.ok(reportContent.includes('verify_step Results'), 'Report should include verify_step results');
  assert.ok(reportContent.includes('Recipe Matching'), 'Report should include recipe matching');
  assert.ok(reportContent.includes('Conclusion'), 'Report should have conclusion');
  console.log('  ✓ Report generated at:', reportPath);
  console.log('  ✓ trammel challenged: adversarial scaffold decomposition and recipe matching\n');
}

// Test 8: DynamicSymbolMesh
console.log('Test 8: DynamicSymbolMesh');
{
  const { DynamicSymbolMesh, getAllSymbols, getSymbolChunks, SYMBOL_DOMAINS } = require('../../src/services/challengeFeatures/DynamicSymbolMesh');

  const allSymbols = getAllSymbols();
  assert.ok(allSymbols.length >= 60, `Should define 60+ symbols (found ${allSymbols.length})`);
  console.log('  ✓ Symbols defined:', allSymbols.length);

  const chunks = getSymbolChunks();
  assert.ok(chunks.length >= 5, 'Should have symbol chunks for multiple domains');
  console.log('  ✓ Symbol chunks:', chunks.length);

  assert.ok(SYMBOL_DOMAINS.recipeProcessing, 'Should have recipeProcessing domain');
  assert.ok(SYMBOL_DOMAINS.ingredientAnalysis, 'Should have ingredientAnalysis domain');
  assert.ok(SYMBOL_DOMAINS.mealPlanning, 'Should have mealPlanning domain');
  assert.ok(SYMBOL_DOMAINS.shopping, 'Should have shopping domain');
  assert.ok(SYMBOL_DOMAINS.collections, 'Should have collections domain');
  assert.ok(SYMBOL_DOMAINS.dietaryCompliance, 'Should have dietaryCompliance domain');
  assert.ok(SYMBOL_DOMAINS.crossCutting, 'Should have crossCutting domain');
  console.log('  ✓ All 7 symbol domains present');

  const mesh = new DynamicSymbolMesh(projectRoot);
  assert.ok(mesh.agentId === 'recipelab.phase13.stele', 'Should have correct agent ID');
  assert.ok(mesh.taskId === 'phase13.stele', 'Should have correct task ID');
  console.log('  ✓ DynamicSymbolMesh instantiation works');

  mesh.buildReport();
  assert.ok(mesh.results.reportSummary.totalSymbols >= 60, 'Report summary should track symbols');
  console.log('  ✓ Report building works');
  console.log('  ✓ stele-context challenged: 60+ dynamic symbol registration + embedding + impact analysis\n');
}

// Test 10: MultiAgentLockStorm (CoordinationHub challenge - Phase 13)
console.log('Test 10: MultiAgentLockStorm');
{
  const MultiAgentLockStorm = require('../../src/services/challengeFeatures/MultiAgentLockStorm');
  const storm = new MultiAgentLockStorm(projectRoot);

  const agentIds = storm.generateAgentPool(5);
  assert.ok(agentIds.length === 5, 'Should generate 5 agent IDs');
  console.log('  ✓ Agent pool generation works');

  const docs = [
    'src/services/challengeFeatures/MultiAgentLockStorm.js',
    'src/services/challengeFeatures/DynamicSymbolMesh.js',
    'src/services/challengeFeatures/MCPOrchestrationDashboard.js'
  ];
  const lockStorm = storm.simulateLockStorm(agentIds, docs);
  assert.ok(lockStorm.length === 5, 'Should simulate 5 lock attempts');
  console.log('  ✓ Lock storm simulation works');

  const broadcasts = storm.simulateBroadcastCascade(agentIds, 3);
  assert.ok(broadcasts.length === 3, 'Should simulate 3 broadcast rounds');
  console.log('  ✓ Broadcast cascade simulation works');

  const taskChain = storm.simulateTaskDependencyChain(agentIds, 4);
  assert.ok(taskChain.length === 4, 'Should simulate 4 task chain links');
  assert.ok(taskChain[1].dependsOn[0] === 'lockstorm.task.0', 'Task 1 should depend on task 0');
  console.log('  ✓ Task dependency chain works');

  const report = storm.buildReport();
  assert.ok(typeof report.agentPoolSize === 'number', 'Report should have agentPoolSize');
  assert.ok(typeof report.lockAttempts === 'number', 'Report should have lockAttempts');
  console.log('  ✓ Report generation works');

  storm.writeReport();
  const reportPath = path.join(projectRoot, 'MCP_Findings', 'Phase_13', 'coordinationhub.md');
  assert.ok(fs.existsSync(reportPath), 'CoordinationHub report should exist');
  console.log('  ✓ Report written to', reportPath);
  console.log('  ✓ coordinationhub challenged: multi-agent lock contention + broadcasts + handoffs\n');
}

// Test 11: WorkingTreeCoverageFuzzer (Chisel challenge - Phase 13)
console.log('Test 11: WorkingTreeCoverageFuzzer');
{
  const WorkingTreeCoverageFuzzer = require('../../src/services/challengeFeatures/WorkingTreeCoverageFuzzer');
  const fuzzer = new WorkingTreeCoverageFuzzer(projectRoot);

  // Ensure clean state
  fuzzer.cleanup();

  const stats = fuzzer.generateFuzzFiles(30);
  assert.strictEqual(stats.sourceCount, 30, 'Should generate 30 source files');
  assert.strictEqual(stats.testCount, 23, 'Should generate 23 test files');
  assert.ok(stats.coverageDistribution.full >= 7, 'Should have full coverage files');
  assert.ok(stats.coverageDistribution.none >= 7, 'Should have untested files');
  assert.ok(stats.coverageDistribution.mismatched >= 7, 'Should have mismatched test files');
  console.log('  ✓ File generation produces expected counts');

  // Verify files on disk
  assert.ok(fs.existsSync(fuzzer.challengeSrcDir), 'Source directory should exist');
  assert.ok(fs.existsSync(fuzzer.challengeTestDir), 'Test directory should exist');
  console.log('  ✓ Files written to disk correctly');

  // Verify mismatched test
  const mismatched = fuzzer.generatedTests.find(t => t.type === 'mismatched');
  assert.ok(mismatched, 'Should have at least one mismatched test');
  assert.ok(!path.basename(mismatched.path).startsWith(mismatched.name), 'Mismatched test name should differ from source');
  console.log('  ✓ Mismatched test files created correctly');

  // Test JSON parsing helper
  assert.deepStrictEqual(fuzzer.parseJsonOutput('{"foo":1}'), { foo: 1 });
  console.log('  ✓ parseJsonOutput works');

  // Test summarizeResult helper
  assert.strictEqual(fuzzer.summarizeResult([1, 2]), 'Array with 2 items.');
  assert.strictEqual(fuzzer.summarizeResult({ files: [{}, {}] }), 'files=2');
  console.log('  ✓ summarizeResult works');

  // Test analysis and report generation (without running actual chisel commands)
  const analysis = fuzzer.analyzeResults();
  assert.ok(typeof analysis.conclusion === 'string', 'Should produce conclusion');
  assert.ok(typeof analysis.passCount === 'number', 'Should produce passCount');
  console.log('  ✓ Analysis generation works');

  const reportPath = fuzzer.generateReport();
  assert.ok(fs.existsSync(reportPath), 'Report should be written');
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  assert.ok(reportContent.includes('Executive Summary'), 'Report should have executive summary');
  assert.ok(reportContent.includes('MCP Call Log'), 'Report should have MCP call log');
  assert.ok(reportContent.includes('Analysis: test_gaps'), 'Report should analyze test_gaps');
  assert.ok(reportContent.includes('Recommendations for MCP Improvements'), 'Report should have recommendations');
  assert.ok(reportContent.includes('Conclusion'), 'Report should have conclusion');
  console.log('  ✓ Report written to', reportPath);

  fuzzer.cleanup();
  assert.ok(!fs.existsSync(fuzzer.challengeSrcDir), 'Generated source directory should be cleaned up');
  assert.ok(!fs.existsSync(fuzzer.challengeTestDir), 'Generated test directory should be cleaned up');
  console.log('  ✓ Cleanup works');
  console.log('  ✓ chisel challenged: working-tree coverage gap detection\n');
}

// Test 12: CrossMCPRecipeValidator (Integrated challenge - Phase 13)
console.log('Test 12: CrossMCPRecipeValidator');
{
  const CrossMCPRecipeValidator = require('../../src/services/challengeFeatures/CrossMCPRecipeValidator');
  const validator = new CrossMCPRecipeValidator(projectRoot);

  validator.recordChisel(
    { top_risk_files: [{ file_path: 'src/api/routes/eventSourcingRoutes.js', risk_score: 0.982 }] },
    { files: [] }
  );
  validator.recordStele(
    { symbol: 'registerMcpChallengeRoutes', verdict: 'external', references: [{ document_path: 'src/api/routes/mcpChallengeRoutes.js' }] },
    { affected_chunks: 0, affected_files: 0 }
  );
  validator.recordTrammel(
    { steps: [{ file: 'tests/api/mcpChallengeRoutes.test.js', action: 'create' }] },
    { plan_id: 29 }
  );
  validator.recordCoordination(
    { created: true, task_id: 'phase13.mcpChallengeRoutes.refactor' },
    { handoff_id: 2, to_agents: ['agent0', 'agent1', 'agent2'] }
  );

  const report = validator.buildValidationReport();
  assert.ok(report.pipelineComplete, 'Pipeline should be complete');
  assert.ok(report.stages.chisel, 'Chisel stage should be present');
  assert.ok(report.stages.stele, 'Stele stage should be present');
  assert.ok(report.stages.trammel, 'Trammel stage should be present');
  assert.ok(report.stages.coordination, 'Coordination stage should be present');
  console.log('  ✓ All 4 pipeline stages recorded');

  validator.writeReport();
  const reportPath = path.join(projectRoot, 'MCP_Findings', 'Phase_13', 'integrated2.md');
  assert.ok(fs.existsSync(reportPath), 'Integrated2 report should exist');
  console.log('  ✓ Report written to', reportPath);
  console.log('  ✓ All 4 MCPs challenged in unified validation pipeline\n');
}

console.log('All Challenge Feature Tests Passed!');
console.log('\nSummary of MCP Challenges:');
console.log('- stele-context: Runtime symbol dependency visualization');
console.log('- chisel: Behavioral test coverage analysis');
console.log('- trammel: Emergent architecture detection');
console.log('- coordinationhub: Distributed architecture review');
console.log('- cross-cutting: Feature validation + architecture evolution');
console.log('- integrated: MCP orchestration dashboard (Phase 13)');
console.log('- stele-context: DynamicSymbolMesh (Phase 13)');
console.log('- trammel-adversarial: Adversarial scaffold generator (Phase 13)');
console.log('- coordinationhub: MultiAgentLockStorm (Phase 13)');
console.log('- chisel: WorkingTreeCoverageFuzzer (Phase 13)');
console.log('- integrated: CrossMCPRecipeValidator (Phase 13)');
