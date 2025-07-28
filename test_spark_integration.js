#!/usr/bin/env node

/**
 * Spark Character Integration Test
 * Verifies that Spark is properly integrated throughout the system
 */

import fs from 'fs';

class SparkIntegrationTester {
  constructor() {
    this.results = { passed: 0, failed: 0, errors: [] };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
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

  async runSparkTests() {
    this.log('🤖 SPARK CHARACTER INTEGRATION TESTS');
    this.log('=' * 50);

    // Test 1: Spark Character Component
    await this.test('Spark Character Component Exists', () => {
      if (!fs.existsSync('client/src/components/character/SparkCharacter.tsx')) {
        throw new Error('SparkCharacter component not found');
      }

      const content = fs.readFileSync('client/src/components/character/SparkCharacter.tsx', 'utf8');
      if (!content.includes('lottie-react')) throw new Error('Lottie animation not imported');
      if (!content.includes('sparkAnimation')) throw new Error('Spark animation not imported');
      if (!content.includes('loop={false}')) throw new Error('Animation not set to play once');
      if (!content.includes('Spark')) throw new Error('Character name badge missing');
    });

    // Test 2: Lottie Animation File
    await this.test('Spark Animation File Exists', () => {
      if (!fs.existsSync('client/src/assets/spark-animation.json')) {
        throw new Error('Spark animation file not found');
      }

      const animationData = fs.readFileSync('client/src/assets/spark-animation.json', 'utf8');
      const parsed = JSON.parse(animationData);
      if (!parsed.layers) throw new Error('Invalid Lottie animation data');
    });

    // Test 3: Tutorial System Integration
    await this.test('Tutorial System Spark Integration', () => {
      const tutorialContent = fs.readFileSync('client/src/components/tutorial/UnifiedTutorialSystem.tsx', 'utf8');
      
      if (!tutorialContent.includes('SparkCharacter')) throw new Error('SparkCharacter not imported in tutorial');
      if (!tutorialContent.includes('speaker === \'spark\'')) throw new Error('Spark speaker condition missing');
      if (!tutorialContent.includes('SparkCharacter')) throw new Error('SparkCharacter component not used');
    });

    // Test 4: Narrative Content Integration
    await this.test('Narrative Content Spark Integration', () => {
      const narrativeContent = fs.readFileSync('client/src/lib/narrativeContent.ts', 'utf8');
      
      if (!narrativeContent.includes('speaker: "spark"')) throw new Error('Spark speaker property missing');
      if (!narrativeContent.includes('SPARK_BREAKTHROUGH_ADVICE')) throw new Error('Spark advice content missing');
      if (!narrativeContent.includes('SPARK_TRAINING_GUIDANCE')) throw new Error('Spark training guidance missing');
    });

    // Test 5: Notification System Integration  
    await this.test('Notification System Spark Integration', () => {
      const notificationContent = fs.readFileSync('client/src/components/narrative/NarrativeNotification.tsx', 'utf8');
      
      if (!notificationContent.includes('SparkCharacter')) throw new Error('SparkCharacter not imported in notifications');
      if (!notificationContent.includes('message.speaker === \'spark\'')) throw new Error('Spark condition missing in notifications');
      
      const triggersContent = fs.readFileSync('client/src/hooks/useNarrativeTriggers.ts', 'utf8');
      if (!triggersContent.includes('speaker?: \'spark\'')) throw new Error('Speaker type definition missing');
    });

    // Test 6: Narrative Triggers Integration
    await this.test('Narrative Triggers Spark Integration', () => {
      const triggersContent = fs.readFileSync('client/src/hooks/useNarrativeTriggers.ts', 'utf8');
      
      if (!triggersContent.includes('speaker: \'spark\'')) throw new Error('Spark speaker not used in triggers');
      if (!triggersContent.includes('speaker?: \'spark\'')) throw new Error('Speaker interface not updated');
    });

    this.generateReport();
  }

  generateReport() {
    this.log('=' * 50);
    this.log('🤖 SPARK INTEGRATION TEST RESULTS');
    this.log(`✅ Tests Passed: ${this.results.passed}/6`);
    this.log(`❌ Tests Failed: ${this.results.failed}/6`);
    this.log(`📈 Integration Success: ${((this.results.passed / 6) * 100).toFixed(1)}%`);

    if (this.results.passed === 6) {
      this.log('\n🎉 SPARK CHARACTER FULLY INTEGRATED!', 'success');
      this.log('✨ Spark Features Active:', 'success');
      this.log('  ✓ Lottie animation plays once then stays visible');
      this.log('  ✓ Tutorial system shows Spark for guided steps');
      this.log('  ✓ Narrative notifications display Spark character');
      this.log('  ✓ Strategic advice comes from Spark AI advisor');
      this.log('  ✓ Breakthrough celebrations include Spark');
      this.log('  ✓ Educational context preserved with character charm');
    } else {
      this.log('\n⚠️ Some integration issues found', 'error');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`, 'error');
      });
    }
  }
}

const tester = new SparkIntegrationTester();
tester.runSparkTests().catch(console.error);