export interface SPEIDeposit {
  id: string;
  amount: number;
  currency: 'MXN';
  sender_clabe: string;
  sender_name: string;
  receiver_clabe: string;
  receiver_name: string;
  reference: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export class SPEIDepositService {
  private deposits: SPEIDeposit[] = [];

  constructor() {
    console.log('🏦 Mexican SPEI Deposits Service initialized');
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

  private async simulateProcessing(deposit: SPEIDeposit): Promise<void> {
    try {
      console.log(`🔄 Simulating SPEI deposit via Juno API...`);

      // Prepare the request body with the deposit data
      const requestBody = {
        amount: deposit.amount,
        currency: deposit.currency,
        sender_clabe: deposit.sender_clabe,
        sender_name: deposit.sender_name,
        receiver_clabe: deposit.receiver_clabe, // Using placeholder value
        receiver_name: deposit.receiver_name,
        reference: deposit.reference
      };

      // Make HTTP POST request to Juno's test deposits endpoint
      const response = await fetch('https://stage.buildwithjuno.com/spei/test/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, you would add authentication headers here
          // 'Authorization': `Bearer ${process.env.JUNO_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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