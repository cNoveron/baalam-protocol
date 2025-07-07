# MXN SPEI Deposits with HMAC Authentication

This package provides HMAC-SHA256 authentication for Juno API requests, specifically designed for Mexican SPEI (Sistema de Pagos Electrónicos Interbancarios) deposits.

## Features

- 🔐 **HMAC-SHA256 Authentication**: Implements Juno's required authentication method
- 🏦 **SPEI Deposit Processing**: Handle Mexican bank transfers
- 🛡️ **Secure Request Signing**: Automatic signature generation for all API calls
- 🔄 **Retry Logic**: Built-in error handling and retry mechanisms
- 📊 **TypeScript Support**: Full type safety and IntelliSense support

## Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
export JUNO_API_KEY="your_api_key_here"
export JUNO_API_SECRET="your_api_secret_here"
```

## Quick Start

### Basic Usage

```typescript
import { createHMACAuthenticator } from './src/auth';

// Create authenticator
const authenticator = createHMACAuthenticator();

// Make authenticated request
const response = await authenticator.authenticatedFetch(
  'https://stage.buildwithjuno.com/spei/test/deposits',
  'POST',
  {
    amount: 1000,
    currency: 'MXN',
    sender_clabe: '012345678901234567',
    sender_name: 'Juan Pérez',
    receiver_clabe: '987654321098765432',
    receiver_name: 'María García',
    reference: 'PAYMENT-001'
  }
);
```

### Using the Juno API Client

```typescript
import { createJunoAPIClient } from './src/juno-api-client';

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

// Get account balance
const balance = await client.getAccountBalance();

// Get deposit history
const deposits = await client.getSPEIDeposits(10, 0);
```

## HMAC Authentication Details

### How It Works

The HMAC authentication follows Juno's specification:

1. **Nonce Generation**: Creates a unique, increasing integer for each request
2. **Signature String**: Concatenates `nonce + HTTP method + request path + JSON payload`
3. **HMAC Generation**: Uses SHA-256 HMAC with your API secret as the key
4. **Authorization Header**: Base64-encodes the authentication payload

### Signature Format

```
Authorization: base64({
  "key": "your_api_key",
  "nonce": 1234567890,
  "signature": "hmac_sha256_signature_here"
})
```

### Example Request

```typescript
// Request details
const method = 'POST';
const path = '/spei/test/deposits';
const body = { amount: 1000, currency: 'MXN' };
const nonce = 1234567890;

// Signature string: "1234567890POST/spei/test/deposits{"amount":1000,"currency":"MXN"}"
const signatureString = `${nonce}${method}${path}${JSON.stringify(body)}`;

// Generate HMAC-SHA256 signature
const signature = createHmac('sha256', apiSecret)
  .update(signatureString)
  .digest('hex');
```

## API Reference

### HMACAuthenticator

The main authentication class that handles HMAC signature generation.

```typescript
class HMACAuthenticator {
  constructor(config: HMACAuthConfig)

  // Generate authentication headers
  authenticateRequest(request: AuthenticatedRequest): Record<string, string>

  // Make authenticated fetch request
  authenticatedFetch(url: string, method: string, body?: any): Promise<Response>

  // Validate response signatures
  validateResponseSignature(responseBody: string, expectedSignature: string): boolean
}
```

### JunoAPIClient

High-level client for Juno API operations.

```typescript
class JunoAPIClient {
  // Create SPEI deposit
  createSPEIDeposit(deposit: SPEIDepositRequest): Promise<SPEIDepositResponse>

  // Get account balance
  getAccountBalance(): Promise<AccountBalance[]>

  // Get SPEI deposits history
  getSPEIDeposits(limit?: number, offset?: number): Promise<SPEIDepositResponse[]>

  // Get specific deposit
  getSPEIDeposit(depositId: string): Promise<SPEIDepositResponse>

  // Cancel pending deposit
  cancelSPEIDeposit(depositId: string): Promise<{ success: boolean; message: string }>

  // Generic request method
  request<T>(method: string, path: string, body?: any): Promise<T>
}
```

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const client = createJunoAPIClient();
  const deposit = await client.createSPEIDeposit(depositData);
  console.log('Success:', deposit);
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Authentication failed - check your API credentials');
  } else if (error.message.includes('429')) {
    console.error('Rate limit exceeded - implement retry logic');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JUNO_API_KEY` | Your Juno API key | Yes |
| `JUNO_API_SECRET` | Your Juno API secret | Yes |

## Security Best Practices

1. **Never commit API credentials** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Validate responses** when possible
5. **Implement rate limiting** to avoid API abuse
6. **Log authentication failures** for monitoring

## Testing

Run the example usage:

```bash
# Set environment variables first
export JUNO_API_KEY="your_key"
export JUNO_API_SECRET="your_secret"

# Run examples
npx ts-node src/example-usage.ts
```

## Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Ensure `JUNO_API_KEY` and `JUNO_API_SECRET` are set
   - Check for typos in variable names

2. **"Authentication failed"**
   - Verify API credentials are correct
   - Check if API key has proper permissions
   - Ensure nonce is unique and increasing

3. **"Rate limit exceeded"**
   - Implement exponential backoff
   - Reduce request frequency
   - Check API usage limits

### Debug Mode

Enable debug logging:

```typescript
// Add to your code for debugging
console.log('Request headers:', headers);
console.log('Signature string:', signatureString);
console.log('Generated signature:', signature);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see package.json for details.