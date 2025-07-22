import { HMACAuthenticator } from '../src/auth';
import { createHmac } from 'crypto';

/**
 * Simple test runner for HMAC authentication
 */
class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => boolean }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => boolean) {
    this.tests.push({ name, fn });
  }

  run() {
    console.log('🧪 Running HMAC Authentication Tests\n');

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
const testConfig = {
  apiKey: 'test_api_key_12345',
  apiSecret: 'test_api_secret_67890'
};

const runner = new SimpleTestRunner();
const authenticator = new HMACAuthenticator(testConfig);

// Test 1: Nonce generation
runner.test('Nonce generation should be unique and increasing', () => {
  const nonce1 = (authenticator as any).generateNonce();
  const nonce2 = (authenticator as any).generateNonce();
  return nonce2 > nonce1 && typeof nonce1 === 'string' && typeof nonce2 === 'string';
});

// Test 2: Signature string building
runner.test('Signature string building should be correct', () => {
  const method = 'POST';
  const path = '/spei/test/deposits';
  const payload = { amount: 1000, currency: 'MXN' };
  const nonce = 1234567890;

  const signatureString = (authenticator as any).buildSignatureString(nonce, method, path, payload);
  const expectedString = `${nonce}${method}${path}${JSON.stringify(payload)}`;

  return signatureString === expectedString;
});

// Test 3: HMAC signature generation
runner.test('HMAC signature generation should be correct', () => {
  const signatureString = '1234567890POST/spei/test/deposits{"amount":1000,"currency":"MXN"}';

  const signature = (authenticator as any).generateSignature(signatureString);
  const manualSignature = createHmac('sha256', testConfig.apiSecret)
    .update(signatureString)
    .digest('hex');

  return signature === manualSignature && signature.length === 64;
});

// Test 4: Authorization header creation with body
runner.test('Authorization header creation should include required fields for POST', () => {
  const headers = authenticator.authenticateRequest({
    method: 'POST',
    path: '/spei/test/deposits',
    body: { amount: 1000, currency: 'MXN' }
  });

  return headers.hasOwnProperty('Content-Type') &&
         headers.hasOwnProperty('Authorization') &&
         headers['Content-Type'] === 'application/json';
});

// Test 4b: Authorization header creation without body
runner.test('Authorization header creation should not include Content-Type for GET', () => {
  const headers = authenticator.authenticateRequest({
    method: 'GET',
    path: '/spei/v1/clabes'
  });

  return !headers.hasOwnProperty('Content-Type') &&
         headers.hasOwnProperty('Authorization');
});

// Test 5: Base64 decoding of auth header
runner.test('Authorization header should be valid base64 JSON', () => {
  const headers = authenticator.authenticateRequest({
    method: 'GET',
    path: '/accounts/balance'
  });

  const authHeader = headers.Authorization;
  const decodedAuth = JSON.parse(Buffer.from(authHeader, 'base64').toString());

  return decodedAuth.hasOwnProperty('key') &&
         decodedAuth.hasOwnProperty('nonce') &&
         decodedAuth.hasOwnProperty('signature') &&
         decodedAuth.key === testConfig.apiKey;
});

// Test 6: Response signature validation
runner.test('Response signature validation should work correctly', () => {
  const testResponseBody = '{"status":"success","id":"123"}';
  const testResponseSignature = createHmac('sha256', testConfig.apiSecret)
    .update(testResponseBody)
    .digest('hex');

  const isValid = authenticator.validateResponseSignature(testResponseBody, testResponseSignature);
  const isInvalid = authenticator.validateResponseSignature(testResponseBody, 'invalid_signature');

  return isValid === true && isInvalid === false;
});

// Test 7: HTTP methods support
runner.test('Should support all HTTP methods', () => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const path = '/api/test';

  return methods.every(method => {
    const headers = authenticator.authenticateRequest({
      method,
      path,
      body: method === 'GET' ? undefined : { test: 'data' }
    });

    return headers.Authorization !== undefined;
  });
});

// Run all tests
if (require.main === module) {
  const success = runner.run();
  process.exit(success ? 0 : 1);
}