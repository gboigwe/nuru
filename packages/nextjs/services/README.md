# Comprehensive Error Handling & Transaction Recovery

This module provides robust error handling and transaction recovery for blockchain transactions in the Nuru application.

## Features

- **Automatic Retry Logic**: Implements exponential backoff for transient failures
- **RPC Fallback**: Automatically switches between multiple RPC providers
- **Stuck Transaction Detection**: Identifies and recovers from stuck transactions
- **User-Friendly Error Messages**: Converts technical errors into user-friendly messages
- **Transaction Monitoring**: Tracks transaction status and provides updates

## Services

### 1. RetryService
Handles automatic retries for failed transactions with configurable backoff.

### 2. RPCFallbackProvider
Manages multiple RPC endpoints and automatically fails over if the primary fails.

### 3. TransactionRecoveryService
Detects and recovers from stuck transactions with speed-up and cancellation support.

### 4. ErrorMessageService
Converts technical errors into user-friendly messages with actionable steps.

### 5. EnhancedPaymentExecutor
High-level service that combines all the above for a seamless payment experience.

## Usage

```typescript
import { createEnhancedPaymentExecutor } from '~/services/payment';

// In your component or service:
const paymentExecutor = await createEnhancedPaymentExecutor();

const result = await paymentExecutor.executePaymentWithRecovery(
  {
    to: '0x...',
    amount: '1000000000000000000', // 1 ETH in wei
  },
  (status) => {
    // Update UI with status
    console.log('Transaction status:', status);
  }
);

if (result.success) {
  console.log('Transaction successful!', result.txHash);
} else if (result.userError) {
  // Show user-friendly error
  console.error(result.userError.message);
}
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_ALCHEMY_RPC_URL`: Alchemy RPC endpoint
- `NEXT_PUBLIC_QUICKNODE_RPC_URL`: QuickNode RPC endpoint

## Error Handling

The system categorizes errors into three severity levels:

1. **Info**: Informational messages (e.g., transaction cancelled by user)
2. **Warning**: Recoverable errors (e.g., low gas price)
3. **Error**: Critical errors that require user action

## Transaction Recovery

The system automatically handles:
- Network timeouts
- Stuck transactions
- RPC failures
- Gas price adjustments
- Nonce management

## Testing

To test the error handling:

```bash
# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
