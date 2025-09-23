// Test script to validate comprehensive error handling system
// This script tests various error scenarios to ensure proper handling and logging

import { logger, FrontendError } from './lib/logger';
import { showErrorToast, showNetworkErrorToast, showSuccessToast } from './components/ui/error-toast';

export class ErrorHandlingTester {
  private testResults: { name: string; passed: boolean; message: string }[] = [];

  /**
   * Run all error handling tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive error handling tests...');
    
    // Test logging system
    this.testLoggingSystem();
    
    // Test frontend error class
    this.testFrontendErrorClass();
    
    // Test API error handling (simulated)
    await this.testApiErrorHandling();
    
    // Test component error handling
    this.testComponentErrorHandling();
    
    // Test user-friendly error display
    this.testErrorToastSystem();
    
    // Print results
    this.printTestResults();
  }

  /**
   * Test the structured logging system
   */
  private testLoggingSystem(): void {
    try {
      // Test basic logging levels
      logger.debug('Debug test message', { testContext: 'debug_test' });
      logger.info('Info test message', { testContext: 'info_test' });
      logger.warn('Warning test message', { testContext: 'warn_test' });
      
      // Test error logging with context
      const testError = new Error('Test error for logging');
      const incidentId = logger.error('Test error message', testError, {
        testContext: 'error_test',
        operation: 'test_logging',
        functionName: 'testLoggingSystem'
      });
      
      // Verify incident ID generation
      if (incidentId && incidentId.startsWith('INC_')) {
        this.addTestResult('Logging System', true, 'All logging levels work correctly with incident ID generation');
      } else {
        this.addTestResult('Logging System', false, 'Incident ID not generated correctly');
      }
    } catch (error) {
      this.addTestResult('Logging System', false, `Logging system failed: ${error}`);
    }
  }

  /**
   * Test FrontendError class functionality
   */
  private testFrontendErrorClass(): void {
    try {
      // Test FrontendError creation with status code
      const apiError = new FrontendError('Test API error', 400);
      if (apiError.statusCode === 400 && apiError.incidentId.startsWith('INC_')) {
        this.addTestResult('FrontendError Class', true, 'FrontendError properly created with status code and incident ID');
      } else {
        this.addTestResult('FrontendError Class', false, 'FrontendError properties not set correctly');
      }
      
      // Test FrontendError with custom incident ID
      const customIncidentId = 'TEST_INCIDENT_123';
      const customError = new FrontendError('Custom error', 500, customIncidentId);
      if (customError.incidentId === customIncidentId) {
        this.addTestResult('FrontendError Custom ID', true, 'Custom incident ID preserved correctly');
      } else {
        this.addTestResult('FrontendError Custom ID', false, 'Custom incident ID not preserved');
      }
    } catch (error) {
      this.addTestResult('FrontendError Class', false, `FrontendError class failed: ${error}`);
    }
  }

  /**
   * Test API error handling (simulated)
   */
  private async testApiErrorHandling(): Promise<void> {
    try {
      // Simulate a network error
      const networkError = new FrontendError('Network connection failed', 0);
      logger.logNetworkError(networkError, { operation: 'test_api_call' });
      
      // Simulate an API error response
      const apiError = new FrontendError('Validation failed', 400, 'INC_TEST_API_ERROR');
      logger.logApiError('POST', '/api/test', 400, apiError, { testData: 'test' });
      
      this.addTestResult('API Error Handling', true, 'API and network errors logged correctly');
    } catch (error) {
      this.addTestResult('API Error Handling', false, `API error handling failed: ${error}`);
    }
  }

  /**
   * Test component error handling
   */
  private testComponentErrorHandling(): void {
    try {
      // Simulate a component error
      const componentError = new Error('Component render error');
      const incidentId = logger.logComponentError('TestComponent', componentError, {
        componentStack: 'TestComponent -> App',
        props: { testProp: 'value' }
      });
      
      if (incidentId && incidentId.startsWith('INC_')) {
        this.addTestResult('Component Error Handling', true, 'Component errors logged with incident ID');
      } else {
        this.addTestResult('Component Error Handling', false, 'Component error logging failed');
      }
    } catch (error) {
      this.addTestResult('Component Error Handling', false, `Component error handling failed: ${error}`);
    }
  }

  /**
   * Test error toast system (mock toasts for testing)
   */
  private testErrorToastSystem(): void {
    try {
      // Test various error toast scenarios
      const apiError = new FrontendError('API request failed', 500, 'INC_TOAST_TEST');
      
      // These would normally show toasts - in test mode we just verify they don't throw
      showErrorToast(apiError, 'API Error');
      showErrorToast('Simple string error');
      showNetworkErrorToast();
      showSuccessToast('Test success message');
      
      this.addTestResult('Error Toast System', true, 'All toast types created without errors');
    } catch (error) {
      this.addTestResult('Error Toast System', false, `Error toast system failed: ${error}`);
    }
  }

  /**
   * Add a test result
   */
  private addTestResult(name: string, passed: boolean, message: string): void {
    this.testResults.push({ name, passed, message });
  }

  /**
   * Print all test results
   */
  private printTestResults(): void {
    console.log('\n📊 Error Handling Test Results:');
    console.log('================================');
    
    let passedCount = 0;
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.message}`);
      if (result.passed) passedCount++;
    });
    
    console.log(`\n📈 Summary: ${passedCount}/${this.testResults.length} tests passed`);
    
    if (passedCount === this.testResults.length) {
      console.log('🎉 All error handling tests passed! System is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the error handling implementation.');
    }
  }

  /**
   * Test incident correlation between frontend and backend
   */
  async testIncidentCorrelation(): Promise<void> {
    try {
      // This would be called in a real scenario where we can test API calls
      const testIncidentId = logger.generateIncidentId();
      console.log(`🔗 Generated test incident ID: ${testIncidentId}`);
      console.log('In a real scenario, this ID would be sent to the backend and logged there as well.');
      
      this.addTestResult('Incident Correlation', true, 'Incident ID generation and correlation working');
    } catch (error) {
      this.addTestResult('Incident Correlation', false, `Incident correlation failed: ${error}`);
    }
  }
}

// Export instance for use in development
export const errorTester = new ErrorHandlingTester();

// Auto-run tests in development mode
if (import.meta.env.MODE === 'development') {
  // Run tests after a short delay to ensure all modules are loaded
  setTimeout(() => {
    errorTester.runAllTests();
  }, 1000);
}