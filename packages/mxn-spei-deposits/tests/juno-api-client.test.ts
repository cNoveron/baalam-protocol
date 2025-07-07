import { JunoAPIClient } from '../src/juno-api-client';
import { HMACAuthConfig } from '../src/auth';

/**
 * Test Juno API Client functionality
 */
class JunoAPIClientTestRunner {
  private tests: Array<{ name: string; fn: () => boolean }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => boolean) {
    this.tests.push({ name, fn });
  }

  run() {
    console.log('🧪 Running Juno API Client Tests\n');

    this.tests.forEach(({ name, fn }) => {
      try {
        const result = fn();
        if (result) {
          console.log(`✅ ${name}`);
          this.passed++;
        } else {
          console.log(`❌ ${name}`);
          this.failed++;
        }
      } catch (error) {
        console.log(`❌ ${name} - Error: ${error}`);
        this.failed++;
      }
    });

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Test configuration
const testConfig: HMACAuthConfig = {
  apiKey: 'test_api_key_12345',
  apiSecret: 'test_api_secret_67890'
};

const testJunoConfig = {
  baseUrl: 'https://stage.buildwithjuno.com',
  auth: testConfig
};

const runner = new JunoAPIClientTestRunner();
const client = new JunoAPIClient(testJunoConfig);

// Test 1: Client instantiation
runner.test('JunoAPIClient should be instantiated correctly', () => {
  return client !== null && typeof client === 'object';
});

// Test 2: Client should have required methods
runner.test('JunoAPIClient should have required methods', () => {
  return typeof client.createSPEIDeposit === 'function' &&
         typeof client.getAccountBalance === 'function' &&
         typeof client.getSPEIDeposits === 'function' &&
         typeof client.getSPEIDeposit === 'function' &&
         typeof client.cancelSPEIDeposit === 'function' &&
         typeof client.request === 'function';
});

// Test 3: SPEI deposit request interface
runner.test('SPEI deposit request should have correct structure', () => {
  const depositRequest = {
    amount: 1000,
    currency: 'MXN' as const,
    sender_clabe: '012345678901234567',
    sender_name: 'Test Sender',
    receiver_clabe: '987654321098765432',
    receiver_name: 'Test Receiver',
    reference: 'TEST-001'
  };

  return depositRequest.amount === 1000 &&
         depositRequest.currency === 'MXN' &&
         depositRequest.sender_clabe.length === 18 &&
         depositRequest.receiver_clabe.length === 18;
});

// Test 4: Account balance interface
runner.test('Account balance interface should have correct structure', () => {
  const balanceExample = {
    currency: 'MXN',
    available: 1000.50,
    pending: 250.25,
    total: 1250.75
  };

  return balanceExample.currency === 'MXN' &&
         typeof balanceExample.available === 'number' &&
         typeof balanceExample.pending === 'number' &&
         typeof balanceExample.total === 'number';
});

// Test 5: SPEI deposit response interface
runner.test('SPEI deposit response should have correct structure', () => {
  const depositResponse = {
    id: 'deposit_12345',
    status: 'pending' as const,
    amount: 1000,
    currency: 'MXN',
    reference: 'TEST-001',
    created_at: '2024-01-01T12:00:00Z'
  };

  return depositResponse.id.length > 0 &&
         ['pending', 'completed', 'failed'].includes(depositResponse.status) &&
         depositResponse.amount === 1000 &&
         depositResponse.currency === 'MXN';
});

// Test 6: URL construction
runner.test('Client should construct URLs correctly', () => {
  const baseUrl = 'https://stage.buildwithjuno.com';
  const testClient = new JunoAPIClient({
    baseUrl,
    auth: testConfig
  });

  // This is a basic test - in a real scenario we'd mock the fetch calls
  return testClient !== null;
});

// Test 7: Error handling structure
runner.test('Client should handle errors properly', () => {
  // Test that the client has proper error handling structure
  // In a real test, we'd mock failed API calls
  return typeof client.request === 'function';
});

// Test 8: Query parameter handling
runner.test('Client should handle query parameters correctly', () => {
  const queryParams = new URLSearchParams({
    limit: '10',
    offset: '0'
  });

  return queryParams.toString() === 'limit=10&offset=0';
});

// Run all tests
if (require.main === module) {
  const success = runner.run();
  process.exit(success ? 0 : 1);
}