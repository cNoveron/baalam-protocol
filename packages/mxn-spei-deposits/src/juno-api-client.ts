import { HMACAuthenticator, HMACAuthConfig } from './auth';

export interface JunoAPIConfig {
  baseUrl: string;
  auth: HMACAuthConfig;
}

export interface SPEIDepositRequest {
  amount: number;
  currency: 'MXN';
  sender_clabe: string;
  sender_name: string;
  receiver_clabe: string;
  receiver_name: string;
  reference: string;
}

export interface SPEIDepositResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  reference: string;
  created_at: string;
}

export interface AccountBalance {
  currency: string;
  available: number;
  pending: number;
  total: number;
}

export class JunoAPIClient {
  private authenticator: HMACAuthenticator;
  private baseUrl: string;

  constructor(config: JunoAPIConfig) {
    this.authenticator = new HMACAuthenticator(config.auth);
    this.baseUrl = config.baseUrl;
  }

  /**
   * Create a new SPEI deposit
   */
  async createSPEIDeposit(deposit: SPEIDepositRequest): Promise<SPEIDepositResponse> {
    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}/spei/test/deposits`,
      'POST',
      deposit
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create SPEI deposit: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<SPEIDepositResponse>;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<AccountBalance[]> {
    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}/accounts/balance`,
      'GET'
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get account balance: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<AccountBalance[]>;
  }

  /**
   * Get SPEI deposits history
   */
  async getSPEIDeposits(limit: number = 10, offset: number = 0): Promise<SPEIDepositResponse[]> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}/spei/deposits?${queryParams}`,
      'GET'
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get SPEI deposits: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<SPEIDepositResponse[]>;
  }

  /**
   * Get a specific SPEI deposit by ID
   */
  async getSPEIDeposit(depositId: string): Promise<SPEIDepositResponse> {
    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}/spei/deposits/${depositId}`,
      'GET'
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get SPEI deposit ${depositId}: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<SPEIDepositResponse>;
  }

  /**
   * Cancel a pending SPEI deposit
   */
  async cancelSPEIDeposit(depositId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}/spei/deposits/${depositId}/cancel`,
      'POST'
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel SPEI deposit ${depositId}: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<{ success: boolean; message: string }>;
  }

  /**
   * Generic method for making authenticated requests
   */
  async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const response = await this.authenticator.authenticatedFetch(
      `${this.baseUrl}${path}`,
      method,
      body
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}

/**
 * Factory function to create a Juno API client from environment variables
 */
export function createJunoAPIClient(baseUrl?: string): JunoAPIClient {
  const apiKey = process.env.JUNO_API_KEY;
  const apiSecret = process.env.JUNO_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('JUNO_API_KEY and JUNO_API_SECRET environment variables are required');
  }

  return new JunoAPIClient({
    baseUrl: baseUrl || 'https://stage.buildwithjuno.com',
    auth: { apiKey, apiSecret }
  });
}