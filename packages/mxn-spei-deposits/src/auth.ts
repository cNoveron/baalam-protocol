import { createHmac } from 'crypto';

export interface HMACAuthConfig {
  apiKey: string;
  apiSecret: string;
}

export interface AuthenticatedRequest {
  method: string;
  path: string;
  body?: any;
}

export class HMACAuthenticator {
  private apiKey: string;
  private apiSecret: string;
  private lastNonce: string = '';

  constructor(config: HMACAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Generate a unique nonce that increases with each API call
   * Uses UNIX timestamp with additional uniqueness
   */
  private generateNonce(): string {
    // Get current timestamp in milliseconds (13 digits)
    const timestamp = Date.now();

    // Generate random salt (6 digits)
    const salt = Math.floor(100000 + Math.random() * 900000); // Range: 100000-999999

    // Concatenate timestamp and salt
    this.lastNonce = `${timestamp}${salt}`;
    return this.lastNonce;
  }

  /**
   * Build the signature string according to Juno's specification:
   * nonce + HTTP method + request path + JSON payload
   */
  private buildSignatureString(nonce: string, method: string, path: string, payload?: any): string {
    const jsonPayload = payload ? JSON.stringify(payload) : '';
    return `${nonce}${method}${path}${jsonPayload}`;
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private generateSignature(signatureString: string): string {
    return createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Create authorization header payload
   */
  private createAuthPayload(nonce: string, signature: string): string {
    const authData = {
      key: this.apiKey,
      nonce: nonce,
      signature: signature
    };
    return Buffer.from(JSON.stringify(authData)).toString('base64');
  }

  /**
   * Authenticate a request and return headers
   */
  authenticateRequest(request: AuthenticatedRequest): Record<string, string> {
    const nonce = this.generateNonce();
    const signatureString = this.buildSignatureString(
      nonce,
      request.method.toUpperCase(),
      request.path,
      request.body
    );
    const signature = this.generateSignature(signatureString);
    const authPayload = this.createAuthPayload(nonce, signature);

    const headers: Record<string, string> = {
      'Authorization': authPayload
    };

    // Only add Content-Type for requests with bodies
    if (request.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Create an authenticated fetch request
   */
  async authenticatedFetch(
    url: string,
    method: string,
    body?: any
  ): Promise<Response> {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;

    const headers = this.authenticateRequest({
      method,
      path,
      body
    });

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Validate response signature (if provided by the API)
   */
  validateResponseSignature(
    responseBody: string,
    expectedSignature: string
  ): boolean {
    const calculatedSignature = createHmac('sha256', this.apiSecret)
      .update(responseBody)
      .digest('hex');

    return calculatedSignature === expectedSignature;
  }
}

/**
 * Factory function to create an HMAC authenticator from environment variables
 */
export function createHMACAuthenticator(): HMACAuthenticator {
  const apiKey = process.env.JUNO_API_KEY;
  const apiSecret = process.env.JUNO_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('JUNO_API_KEY and JUNO_API_SECRET environment variables are required');
  }

  return new HMACAuthenticator({ apiKey, apiSecret });
}

/**
 * Utility function to create authenticated headers for any request
 */
export function createAuthenticatedHeaders(
  config: HMACAuthConfig,
  method: string,
  path: string,
  body?: any
): Record<string, string> {
  const authenticator = new HMACAuthenticator(config);
  return authenticator.authenticateRequest({ method, path, body });
}