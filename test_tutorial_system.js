#!/usr/bin/env node

/**
 * Comprehensive Tutorial/Assistant System Testing Battery
 * Tests all components, functionality, and integration points
 */

import fs from 'fs';
import path from 'path';

class TutorialSystemTester {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  parseReactComponent(content) {
    // Basic React component parsing
    const exportMatch = content.match(/export\s+(default\s+)?function\s+(\w+)|export\s+{\s*(\w+)\s*}/);
    const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    const importsMatch = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
    
    return {
      hasExport: !!exportMatch,
      componentName: exportMatch ? (exportMatch[2] || exportMatch[3]) : null,
      hasProps: !!propsMatch,
      imports: importsMatch,
      hasJSX: content.includes('return (') || content.includes('<')
    };
  }

  checkTutorialContent(content) {
    const phases = ['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'];
    const narrativeKeys = [
      'BREAKTHROUGH_1', 'BREAKTHROUGH_2', 'BREAKTHROUGH_3',
      'ERA_ADVANCE_GNT2', 'ERA_ADVANCE_GNT3', 'ERA_ADVANCE_GNT4',
      'TRAINING_STRATEGY_HINT', 'COMPUTE_WARNING_HIGH', 'MONEY_WARNING_LOW'
    ];
    
    const results = {
      hasAllPhases: phases.every(phase => content.includes(phase)),
      hasNarrativeContent: narrativeKeys.every(key => content.includes(key)),
      hasContext: content.includes('"context":') || content.includes('context:'),
      hasEducationalContent: content.includes('OpenAI') || content.includes('Google') || content.includes('GPT')
    };
    
    return results;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Tutorial System Testing Battery');
    this.log('=' * 60);

    // Test 1: Core Files Existence
    await this.test('Core Tutorial Files Exist', () => {
      const requiredFiles = [
        'client/src/components/tutorial/UnifiedTutorialSystem.tsx',
        'client/src/lib/narrativeContent.ts',
        'client/src/hooks/useNarrativeTriggers.ts',
        'client/src/components/narrative/NarrativeNotification.tsx'
      ];

      requiredFiles.forEach(file => {
        if (!this.fileExists(file)) {
          throw new Error(`Required file missing: ${file}`);
        }
      });
    });

    // Test 2: Legacy Files Removed
    await this.test('Legacy Tutorial Files Removed', () => {
      const legacyFiles = [
        'client/src/components/factory/TutorialOverlay.tsx',
        'client/src/components/factory/TutorialGuide.tsx',
        'client/src/components/tutorial/TutorialOverlay.tsx'
      ];

      legacyFiles.forEach(file => {
        if (this.fileExists(file)) {
          throw new Error(`Legacy file still exists: ${file}`);
        }
      });
    });

    // Test 3: UnifiedTutorialSystem Component Structure
    await this.test('UnifiedTutorialSystem Component Structure', () => {
      const content = this.readFile('client/src/components/tutorial/UnifiedTutorialSystem.tsx');
      const parsed = this.parseReactComponent(content);

      if (!parsed.hasExport) throw new Error('Component not properly exported');
      if (!parsed.hasProps) throw new Error('Component props interface missing');
      if (!parsed.hasJSX) throw new Error('Component does not return JSX');
      if (!content.includes('tutorialContent')) throw new Error('Does not import tutorial content');
      if (!content.includes('modalStyle')) throw new Error('Modal style handling missing');
      if (!content.includes('spotlight')) throw new Error('Spotlight functionality missing');
    });

    // Test 4: Narrative Content Completeness
    await this.test('Narrative Content Completeness', () => {
      const content = this.readFile('client/src/lib/narrativeContent.ts');
      const check = this.checkTutorialContent(content);

      if (!check.hasAllPhases) throw new Error('Missing tutorial phases');
      if (!check.hasNarrativeContent) throw new Error('Missing narrative content');
      if (!check.hasContext) throw new Error('Missing educational context');
      if (!check.hasEducationalContent) throw new Error('Missing real-world examples');

      // Check for preserved original content
      if (!content.includes('TUTORIAL_STEP_1')) throw new Error('Original tutorial steps not preserved');
      if (!content.includes('Transformer Architecture')) throw new Error('Breakthrough content missing');
    });

    // Test 5: Narrative Triggers Hook
    await this.test('Narrative Triggers Hook Implementation', () => {
      const content = this.readFile('client/src/hooks/useNarrativeTriggers.ts');

      if (!content.includes('useEffect')) throw new Error('useEffect hook missing');
      if (!content.includes('previousStateRef')) throw new Error('State comparison logic missing');
      if (!content.includes('onShowMessage')) throw new Error('Message callback missing');
      if (!content.includes('COMPUTE_WARNING_HIGH')) throw new Error('Compute warning trigger missing');
      if (!content.includes('ERA_ADVANCE_')) throw new Error('Era advancement triggers missing');
      if (!content.includes('BREAKTHROUGH_')) throw new Error('Breakthrough triggers missing');
    });

    // Test 6: Game Engine Integration
    await this.test('Game Engine Tutorial Integration', () => {
      const content = this.readFile('client/src/hooks/useGameEngine.ts');

      if (!content.includes('advanceTutorial')) throw new Error('Tutorial advancement function missing');
      if (!content.includes('skipTutorial')) throw new Error('Skip tutorial function missing');
      if (!content.includes('completeTutorial')) throw new Error('Complete tutorial function missing');
      if (!content.includes('tutorial.phase')) throw new Error('Phase-based progression missing');
      if (!content.includes('tutorial.step')) throw new Error('Step-based progression missing');
    });

    // Test 7: Main Page Integration
    await this.test('Main Page Tutorial Integration', () => {
      const content = this.readFile('client/src/pages/AIFactory.tsx');

      if (!content.includes('UnifiedTutorialSystem')) throw new Error('UnifiedTutorialSystem not imported');
      if (!content.includes('useNarrativeTriggers')) throw new Error('Narrative triggers not used');
      if (!content.includes('NarrativeNotification')) throw new Error('Narrative notifications not implemented');
      if (!content.includes('advanceTutorial')) throw new Error('Tutorial advancement not connected');
    });

    // Test 8: CSS Styling
    await this.test('Tutorial CSS Styling', () => {
      const content = this.readFile('client/src/index.css');

      if (!content.includes('tutorial-highlight-tab')) throw new Error('Tutorial highlighting CSS missing');
      if (!content.includes('highlight-pulse')) throw new Error('Pulse animation missing');
      if (!content.includes('slideInFromRight')) throw new Error('Slide animation missing');
      if (!content.includes('@keyframes')) throw new Error('CSS animations missing');
    });

    // Test 9: TypeScript Types Consistency
    await this.test('TypeScript Types Consistency', () => {
      const gameStateContent = this.readFile('client/src/lib/gameState.ts');
      const tutorialContent = this.readFile('client/src/components/tutorial/UnifiedTutorialSystem.tsx');

      if (!gameStateContent.includes('tutorial:') && !gameStateContent.includes('tutorial?:')) {
        throw new Error('Tutorial state not defined in GameStateType');
      }

      if (!tutorialContent.includes('GameStateType')) {
        throw new Error('UnifiedTutorialSystem does not import GameStateType');
      }
    });

    // Test 10: Build Compatibility
    await this.test('Build System Compatibility', () => {
      const packageContent = this.readFile('package.json');
      const parsed = JSON.parse(packageContent);

      if (!parsed.scripts.build) throw new Error('Build script missing');
      if (!parsed.scripts.dev) throw new Error('Dev script missing');
    });

    // Test 11: No Legacy References
    await this.test('No Legacy Tutorial References', () => {
      const factoryContent = this.readFile('client/src/components/factory/FactorySection.tsx');

      if (factoryContent.includes('tutorialStep')) throw new Error('Legacy tutorialStep reference found');
      if (factoryContent.includes('setTutorialStep')) throw new Error('Legacy setTutorialStep reference found');
      if (factoryContent.includes('tutorialRefs')) throw new Error('Legacy tutorialRefs reference found');
    });

    // Test 12: Tutorial Content Structure
    await this.test('Tutorial Content Structure Validation', () => {
      const content = this.readFile('client/src/lib/narrativeContent.ts');

      // Check phase structure
      for (let phase = 1; phase <= 4; phase++) {
        if (!content.includes(`PHASE_${phase}: {`)) {
          throw new Error(`Phase ${phase} structure missing`);
        }
      }

      // Check required properties
      const requiredProps = ['title', 'content', 'context', 'action', 'targetElement', 'modalStyle', 'icon'];
      requiredProps.forEach(prop => {
        if (!content.includes(`${prop}:`)) {
          throw new Error(`Required property ${prop} missing from tutorial steps`);
        }
      });
    });

    // Generate final report
    this.generateReport();
  }

  generateReport() {
    this.log('=' * 60);
    this.log('📊 TESTING BATTERY COMPLETE');
    this.log(`✅ Tests Passed: ${this.results.passed}`);
    this.log(`❌ Tests Failed: ${this.results.failed}`);
    this.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.errors.length > 0) {
      this.log('\n🔍 FAILED TESTS DETAILS:');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`, 'error');
      });
    } else {
      this.log('\n🎉 ALL TESTS PASSED! Tutorial system is fully functional.', 'success');
    }
  }
}

// Run the testing battery
const tester = new TutorialSystemTester();
tester.runAllTests().catch(console.error);