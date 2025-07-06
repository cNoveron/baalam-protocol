export interface SPEIDeposit {
  id: string;
  amount: number;
  currency: 'MXN';
  senderAccount: string;
  receiverAccount: string;
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
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status
    deposit.status = 'completed';
    console.log(`✅ SPEI deposit ${deposit.id} completed successfully`);
  }

  private generateId(): string {
    return `SPEI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDeposits(): SPEIDeposit[] {
    return this.deposits;
  }
}