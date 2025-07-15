# HMAC Authentication Implementation Summary

## Overview

This implementation provides a complete HMAC-SHA256 authentication system for the Juno API, specifically designed for Mexican SPEI deposits. The system includes account details retrieval to get proper AUTO_PAYMENT CLABEs as required by the Juno API.

## Key Features Implemented

### 1. HMAC Authentication (`src/auth.ts`)
- **HMACAuthenticator Class**: Core authentication implementation
- **Nonce Generation**: Unique, increasing timestamps for each request
- **Signature Building**: Follows Juno's specification: `nonce + HTTP method + request path + JSON payload`
- **SHA-256 HMAC**: Uses crypto library for secure signature generation
- **Base64 Authorization**: Properly formatted authorization headers

### 2. Account Details Retrieval (`src/juno-api-client.ts`)
- **getAccountDetails()**: Retrieves account information including CLABEs
- **getAutoPaymentCLABEs()**: Filters for AUTO_PAYMENT CLABEs specifically
- **CLABE Type Filtering**: Supports both AUTO_PAYMENT and MANUAL_PAYMENT types
- **Proper Interfaces**: TypeScript interfaces for all response types

### 3. SPEI Deposit Service (`src/deposit.ts`)
- **Enhanced Service**: Integrates with account details API
- **Auto CLABE Selection**: Automatically selects valid AUTO_PAYMENT CLABEs
- **createDepositWithAutoReceiverCLABE()**: Simplified deposit creation
- **Error Handling**: Graceful fallback when authentication unavailable

### 4. Comprehensive Testing (`tests/`)
- **Organized Test Structure**: Tests moved to dedicated `tests/` folder
- **Multiple Test Files**: Separate tests for auth, API client, and deposit service
- **Custom Test Runner**: Simple test runner for TypeScript compatibility
- **Jest Configuration**: Ready for Jest testing framework

## Authentication Flow

```
1. Generate unique nonce (timestamp-based)
2. Build signature string: nonce + method + path + body
3. Create HMAC-SHA256 signature using API secret
4. Base64 encode authorization payload: {key, nonce, signature}
5. Add to Authorization header
```

## Account Details Integration

```
1. Query GET /spei/v1/clabes?clabe_type=AUTO_PAYMENT
2. Filter for ENABLED AUTO_PAYMENT CLABEs
3. Use first available CLABE as receiver_clabe
4. Create deposit with proper receiver CLABE
```

## File Structure

```
packages/mxn-spei-deposits/
├── src/
│   ├── auth.ts                    # HMAC authentication core
│   ├── juno-api-client.ts         # API client with account details
│   ├── deposit.ts                 # SPEI deposit service
│   ├── example-usage.ts           # Usage examples
│   └── index.ts                   # Main exports
├── tests/
│   ├── auth.simple.test.ts        # Authentication tests
│   ├── juno-api-client.test.ts    # API client tests
│   ├── deposit.test.ts            # Deposit service tests
│   ├── run-all.ts                 # Test runner
│   └── setup.ts                   # Test setup
├── jest.config.js                 # Jest configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # Documentation
```

## Usage Examples

### Basic HMAC Authentication
```typescript
import { createHMACAuthenticator } from './src/auth';

const authenticator = createHMACAuthenticator();
const response = await authenticator.authenticatedFetch(
  'https://stage.buildwithjuno.com/spei/v1/clabes',
  'GET'
);
```

### Account Details Retrieval
```typescript
import { createJunoAPIClient } from './src/juno-api-client';

const client = createJunoAPIClient();
const accountDetails = await client.getAccountDetails('AUTO_PAYMENT');
const autoPaymentCLABEs = await client.getAutoPaymentCLABEs();
```

### Simplified Deposit Creation
```typescript
import { SPEIDepositService } from './src/deposit';

const service = new SPEIDepositService();
const deposit = await service.createDepositWithAutoReceiverCLABE({
  amount: "1000",  // Note: string, not number
  currency: 'MXN',
  sender_clabe: '012345678901234567',
  sender_name: 'Your Business Name',  // Must match registered name
  receiver_name: 'Your Business Name',  // Must match registered name
  reference: 'PAYMENT-001'
});
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JUNO_API_KEY` | Your Juno API key | Yes |
| `JUNO_API_SECRET` | Your Juno API secret | Yes |

## Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:auth
npm run test:client
npm run test:deposit

# Run with Jest (when available)
npm run test:jest
```

## Security Features

1. **HMAC-SHA256**: Industry-standard signature algorithm
2. **Nonce Protection**: Prevents replay attacks
3. **Environment Variables**: Secure credential storage
4. **Base64 Encoding**: Proper header formatting
5. **Error Handling**: No credential leakage in errors

## API Endpoints Supported

- `GET /spei/v1/clabes` - Account details and CLABEs
- `POST /spei/test/deposits` - Create test deposits
- `GET /spei/deposits` - Get deposit history
- `GET /spei/deposits/{id}` - Get specific deposit
- `POST /spei/deposits/{id}/cancel` - Cancel deposit
- `GET /accounts/balance` - Get account balance

## Key Implementation Details

### Signature String Format
```
nonce + HTTP_METHOD + request_path + JSON_payload
```

### Authorization Header Format
```
Authorization: base64({
  "key": "api_key",
  "nonce": timestamp,
  "signature": "hmac_sha256_hex"
})
```

### API Request Format (Updated)
Following Juno's API specification:
- **Amount**: Must be a string, not a number
- **Required fields**: `amount`, `receiver_clabe`, `receiver_name`, `sender_clabe`, `sender_name`
- **Optional fields**: `sender_curp`, `receiver_curp` (can be empty strings)
- **Business name matching**: Both sender and receiver names should match registered business name for test deposits
- **Content-Type header**: Only added for requests with bodies (POST/PUT), not for GET requests

### AUTO_PAYMENT CLABE Selection
- Queries `/spei/v1/clabes?clabe_type=AUTO_PAYMENT`
- Filters for `status: "ENABLED"`
- Uses first available CLABE for deposits
- Required for deposit issuance

## Error Handling

- Graceful fallback when credentials unavailable
- Detailed error messages for debugging
- Proper HTTP status code handling
- Network error resilience

## Future Enhancements

1. **Rate Limiting**: Implement request throttling
2. **Caching**: Cache account details for performance
3. **Webhooks**: Handle deposit status updates
4. **Validation**: Enhanced CLABE validation
5. **Monitoring**: Request/response logging

This implementation provides a production-ready foundation for HMAC authentication with the Juno API, specifically optimized for Mexican SPEI deposit processing.