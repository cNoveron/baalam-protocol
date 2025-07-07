import { HMACAuthenticator } from '../src/auth';
import { createHmac } from 'crypto';

/**
 * Test HMAC authentication implementation
 */
describe('HMAC Authentication', () => {
  const testConfig = {
    apiKey: 'test_api_key_12345',
    apiSecret: 'test_api_secret_67890'
  };

  let authenticator: HMACAuthenticator;

  beforeEach(() => {
    authenticator = new HMACAuthenticator(testConfig);
  });

  describe('Nonce Generation', () => {
    it('should generate unique, increasing nonces', () => {
      const nonce1 = (authenticator as any).generateNonce();
      const nonce2 = (authenticator as any).generateNonce();

      expect(nonce2).toBeGreaterThan(nonce1);
      expect(typeof nonce1).toBe('number');
      expect(typeof nonce2).toBe('number');
    });
  });

  describe('Signature String Building', () => {
    it('should build correct signature string', () => {
      const method = 'POST';
      const path = '/spei/test/deposits';
      const payload = { amount: 1000, currency: 'MXN' };
      const nonce = 1234567890;

      const signatureString = (authenticator as any).buildSignatureString(nonce, method, path, payload);
      const expectedString = `${nonce}${method}${path}${JSON.stringify(payload)}`;

      expect(signatureString).toBe(expectedString);
    });

    it('should handle empty payload', () => {
      const method = 'GET';
      const path = '/accounts/balance';
      const nonce = 1234567890;

      const signatureString = (authenticator as any).buildSignatureString(nonce, method, path);
      const expectedString = `${nonce}${method}${path}`;

      expect(signatureString).toBe(expectedString);
    });
  });

  describe('HMAC Signature Generation', () => {
    it('should generate correct HMAC signature', () => {
      const signatureString = '1234567890POST/spei/test/deposits{"amount":1000,"currency":"MXN"}';

      const signature = (authenticator as any).generateSignature(signatureString);

      // Manual verification
      const manualSignature = createHmac('sha256', testConfig.apiSecret)
        .update(signatureString)
        .digest('hex');

      expect(signature).toBe(manualSignature);
      expect(signature).toHaveLength(64); // SHA-256 hex string length
    });
  });

  describe('Authorization Header Creation', () => {
    it('should create proper authorization headers', () => {
      const headers = authenticator.authenticateRequest({
        method: 'POST',
        path: '/spei/test/deposits',
        body: { amount: 1000, currency: 'MXN' }
      });

      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('Authorization');
      expect(headers['Content-Type']).toBe('application/json');
      expect(typeof headers.Authorization).toBe('string');
    });

    it('should create base64 encoded authorization payload', () => {
      const headers = authenticator.authenticateRequest({
        method: 'GET',
        path: '/accounts/balance'
      });

      const authHeader = headers.Authorization;
      const decodedAuth = JSON.parse(Buffer.from(authHeader, 'base64').toString());

      expect(decodedAuth).toHaveProperty('key');
      expect(decodedAuth).toHaveProperty('nonce');
      expect(decodedAuth).toHaveProperty('signature');
      expect(decodedAuth.key).toBe(testConfig.apiKey);
      expect(typeof decodedAuth.nonce).toBe('number');
      expect(typeof decodedAuth.signature).toBe('string');
    });
  });

  describe('Response Signature Validation', () => {
    it('should validate correct response signatures', () => {
      const testResponseBody = '{"status":"success","id":"123"}';
      const testResponseSignature = createHmac('sha256', testConfig.apiSecret)
        .update(testResponseBody)
        .digest('hex');

      const isValid = authenticator.validateResponseSignature(testResponseBody, testResponseSignature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid response signatures', () => {
      const testResponseBody = '{"status":"success","id":"123"}';
      const invalidSignature = 'invalid_signature';

      const isValid = authenticator.validateResponseSignature(testResponseBody, invalidSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('HTTP Methods', () => {
    it('should handle all HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const path = '/api/test';

      methods.forEach(method => {
        const headers = authenticator.authenticateRequest({
          method,
          path,
          body: method === 'GET' ? undefined : { test: 'data' }
        });

        expect(headers.Authorization).toBeDefined();
        expect(headers['Content-Type']).toBe('application/json');
      });
    });
  });
});