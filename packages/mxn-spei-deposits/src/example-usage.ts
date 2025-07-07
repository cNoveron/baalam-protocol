import { createHMACAuthenticator, HMACAuthenticator } from './auth';
import { createJunoAPIClient, JunoAPIClient } from './juno-api-client';

/**
 * Example 1: Basic HMAC Authentication Usage
 */
async function basicHMACExample() {
  console.log('🔐 Example 1: Basic HMAC Authentication');

  try {
    // Create authenticator from environment variables
    const authenticator = createHMACAuthenticator();

    // Example request data
    const requestData = {
      amount: 1000,
      currency: 'MXN',
      sender_clabe: '012345678901234567',
      sender_name: 'Juan Pérez',
      receiver_clabe: '987654321098765432',
      receiver_name: 'María García',
      reference: 'PAYMENT-001'
    };

    // Make authenticated request
    const response = await authenticator.authenticatedFetch(
      'https://stage.buildwithjuno.com/spei/test/deposits',
      'POST',
      requestData
    );

    console.log('✅ Request successful:', response.status);
    const result = await response.json();
    console.log('📄 Response:', result);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 2: Using the Juno API Client
 */
async function junoAPIClientExample() {
  console.log('\n🔐 Example 2: Using Juno API Client');

  try {
    // Create API client
    const client = createJunoAPIClient();

    // Create a SPEI deposit
    const deposit = await client.createSPEIDeposit({
      amount: 1500,
      currency: 'MXN',
      sender_clabe: '012345678901234567',
      sender_name: 'Carlos López',
      receiver_clabe: '987654321098765432',
      receiver_name: 'Ana Martínez',
      reference: 'PAYMENT-002'
    });

    console.log('✅ Deposit created:', deposit);

    // Get account balance
    const balance = await client.getAccountBalance();
    console.log('💰 Account balance:', balance);

    // Get deposit history
    const deposits = await client.getSPEIDeposits(5, 0);
    console.log('📋 Recent deposits:', deposits);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 3: Manual Header Creation
 */
async function manualHeadersExample() {
  console.log('\n🔐 Example 3: Manual Header Creation');

  try {
    const apiKey = process.env.JUNO_API_KEY!;
    const apiSecret = process.env.JUNO_API_SECRET!;

    const authenticator = new HMACAuthenticator({ apiKey, apiSecret });

    // Create headers manually
    const headers = authenticator.authenticateRequest({
      method: 'GET',
      path: '/accounts/balance'
    });

    console.log('🔑 Generated headers:', headers);

    // Use headers with fetch
    const response = await fetch('https://stage.buildwithjuno.com/accounts/balance', {
      method: 'GET',
      headers
    });

    if (response.ok) {
      const balance = await response.json();
      console.log('💰 Balance:', balance);
    } else {
      console.error('❌ Request failed:', response.status);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 4: Error Handling and Retry Logic
 */
async function errorHandlingExample() {
  console.log('\n🔐 Example 4: Error Handling and Retry Logic');

  try {
    const client = createJunoAPIClient();

    // Simulate a request that might fail
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

        const deposit = await client.createSPEIDeposit({
          amount: 2000,
          currency: 'MXN',
          sender_clabe: '012345678901234567',
          sender_name: 'Test User',
          receiver_clabe: '987654321098765432',
          receiver_name: 'Test Receiver',
          reference: `RETRY-TEST-${attempt}`
        });

        console.log('✅ Success on attempt', attempt, ':', deposit);
        break; // Success, exit retry loop

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

  } catch (error) {
    console.error('❌ All retry attempts failed:', error);
  }
}

/**
 * Example 5: Environment Setup Validation
 */
function environmentValidationExample() {
  console.log('\n🔐 Example 5: Environment Setup Validation');

  const requiredEnvVars = ['JUNO_API_KEY', 'JUNO_API_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    console.log('💡 Please set the following environment variables:');
    missingVars.forEach(varName => {
      console.log(`   export ${varName}="your_${varName.toLowerCase()}_value"`);
    });
    return false;
  }

  console.log('✅ All required environment variables are set');
  console.log('🔑 API Key:', process.env.JUNO_API_KEY?.substring(0, 8) + '...');
  console.log('🔐 API Secret:', process.env.JUNO_API_SECRET?.substring(0, 8) + '...');

  return true;
}

/**
 * Main function to run all examples
 */
async function runAllExamples() {
  console.log('🚀 Starting HMAC Authentication Examples\n');

  // Validate environment first
  if (!environmentValidationExample()) {
    console.log('\n❌ Environment validation failed. Please set required variables.');
    return;
  }

  // Run examples
  await basicHMACExample();
  await junoAPIClientExample();
  await manualHeadersExample();
  await errorHandlingExample();

  console.log('\n✅ All examples completed!');
}

// Export functions for individual testing
export {
  basicHMACExample,
  junoAPIClientExample,
  manualHeadersExample,
  errorHandlingExample,
  environmentValidationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}