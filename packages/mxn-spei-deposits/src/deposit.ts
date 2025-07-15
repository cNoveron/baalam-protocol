import { createHMACAuthenticator } from './auth';
import { createJunoAPIClient } from './juno-api-client';

export interface SPEIDeposit {
  id: string;
  amount: string;
  currency: 'MXN';
  sender_clabe: string;
  sender_name: string;
  receiver_clabe: string;
  receiver_name: string;
  reference: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  tracking_code?: string;
  tracking_key?: string;
}

export class SPEIDepositService {
  private deposits: SPEIDeposit[] = [];
  private authenticator: ReturnType<typeof createHMACAuthenticator> | null;
  private junoClient: ReturnType<typeof createJunoAPIClient> | null;

  constructor() {
    console.log('🏦 Mexican SPEI Deposits Service initialized');
    try {
      this.authenticator = createHMACAuthenticator();
      this.junoClient = createJunoAPIClient();
      console.log('🔐 HMAC Authentication initialized successfully');
    } catch (error) {
      console.warn('⚠️ HMAC Authentication not available:', error);
      this.authenticator = null;
      this.junoClient = null;
    }
  }

  async processDeposit(deposit: Omit<SPEIDeposit, 'id' | 'timestamp' | 'status'>): Promise<SPEIDeposit> {
    const newDeposit: SPEIDeposit = {
      ...deposit,
      id: this.generateId(),
      timestamp: new Date(),
      status: 'pending'
    };

    this.deposits.push(newDeposit);

    console.log(`💰 Processing SPEI deposit: ${newDeposit.amount} ${newDeposit.currency}`);
    console.log(`📋 Reference: ${newDeposit.reference}`);

    // Simulate processing
    await this.simulateProcessing(newDeposit);

    return newDeposit;
  }

  /**
   * Get a valid AUTO_PAYMENT CLABE for deposits
   */
  async getValidReceiverCLABE(): Promise<string> {
    if (!this.junoClient) {
      throw new Error('Juno API client not available. Please check your API credentials.');
    }

    try {
      const autoPaymentCLABEs = await this.junoClient.getAutoPaymentCLABEs();

      if (autoPaymentCLABEs.length === 0) {
        throw new Error('No AUTO_PAYMENT CLABEs available for deposits');
      }

      const selectedCLABE = autoPaymentCLABEs[0];
      console.log(`🏦 Using AUTO_PAYMENT CLABE: ${selectedCLABE.clabe}`);

      return selectedCLABE.clabe;
    } catch (error) {
      console.error('❌ Failed to get AUTO_PAYMENT CLABE:', error);
      throw error;
    }
  }

    /**
   * Create a deposit with automatic receiver CLABE selection
   */
  async createDepositWithAutoReceiverCLABE(depositData: {
    amount: string;
    currency: 'MXN';
    sender_clabe: string;
    sender_name: string;
    receiver_name: string;
    reference: string;
  }): Promise<SPEIDeposit> {
    const receiverCLABE = await this.getValidReceiverCLABE();

    return this.processDeposit({
      ...depositData,
      receiver_clabe: receiverCLABE
    });
  }

  private async simulateProcessing(deposit: SPEIDeposit): Promise<void> {
    try {
      console.log(`🔄 Simulating SPEI deposit via Juno API...`);

      // Prepare the request body with the deposit data (following Juno API spec)
      const requestBody = {
        amount: deposit.amount,
        receiver_clabe: deposit.receiver_clabe,
        receiver_name: deposit.receiver_name,
        sender_clabe: deposit.sender_clabe,
        sender_name: deposit.sender_name,
        sender_curp: "",
        receiver_curp: ""
      };

      let response: Response;

      if (this.authenticator) {
        // Use HMAC authenticated request
        console.log(`🔐 Making authenticated request with HMAC signature...`);
        response = await this.authenticator.authenticatedFetch(
          'https://stage.buildwithjuno.com/spei/test/deposits',
          'POST',
          requestBody
        );
      } else {
        // Fallback to unauthenticated request (for testing)
        console.log(`⚠️ Making unauthenticated request (fallback mode)...`);
        response = await fetch('https://stage.buildwithjuno.com/spei/test/deposits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ SPEI deposit ${deposit.id} simulated successfully via Juno API`);
      console.log(`📄 API Response:`, result);

      // Update status based on API response
      deposit.status = 'completed';

    } catch (error) {
      console.error(`❌ Failed to simulate SPEI deposit ${deposit.id}:`, error);
      deposit.status = 'failed';
      throw error;
    }
  }

  private generateId(): string {
    return `SPEI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDeposits(): SPEIDeposit[] {
    return this.deposits;
  }
}