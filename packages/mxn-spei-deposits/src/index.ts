import dotenv from 'dotenv';
import { SPEIDepositService } from './deposit';

// Load environment variables
dotenv.config();

async function main() {
  const service = new SPEIDepositService();

  // Example deposit
  const exampleDeposit = {
    amount: 1000.00,
    currency: 'MXN' as const,
    senderAccount: '012345678901234567',
    receiverAccount: '098765432109876543',
    reference: 'Payment for services'
  };

  try {
    await service.processDeposit(exampleDeposit);

    console.log('\n📊 All deposits:');
    console.log(service.getDeposits());
  } catch (error) {
    console.error('❌ Error processing deposit:', error);
  }
}

// Run the service
if (require.main === module) {
  main().catch(console.error);
}