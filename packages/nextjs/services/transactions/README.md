# Transaction Monitoring Services

Production-grade transaction management for Nuru.

## Services

### TransactionMonitor
Polls transaction status and tracks confirmations.

```typescript
import { transactionMonitor } from '~/services/transactions';

transactionMonitor.initialize(provider);
const status = await transactionMonitor.pollTransactionStatus(txHash);
```

### RetryManager
Executes operations with exponential backoff retry logic.

```typescript
import { retryManager } from '~/services/transactions';

const result = await retryManager.executeWithRetry(
  async () => await sendTransaction(),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### NonceManager
Manages transaction nonces to prevent conflicts.

```typescript
import { nonceManager } from '~/services/transactions';

nonceManager.initialize(provider);
const nonce = await nonceManager.getNextNonce(address);
nonceManager.trackPendingNonce(address, nonce);
```

### GasPriceOracle
Calculates optimal gas prices for transactions.

```typescript
import { gasPriceOracle } from '~/services/transactions';

gasPriceOracle.initialize(provider);
const gasPrice = await gasPriceOracle.getOptimalGasPrice();
```

### TransactionQueue
Queues transactions for sequential execution.

```typescript
import { transactionQueue } from '~/services/transactions';

const id = transactionQueue.add({
  id: 'tx-1',
  execute: async () => await sendTx(),
  maxRetries: 3
});
```

### StuckTransactionDetector
Identifies transactions stuck in mempool.

```typescript
import { stuckTransactionDetector } from '~/services/transactions';

stuckTransactionDetector.initialize(provider);
const stuckTxs = await stuckTransactionDetector.detectStuckTransactions(address);
```

### TransactionReplacer
Speeds up or cancels pending transactions.

```typescript
import { transactionReplacer } from '~/services/transactions';

transactionReplacer.initialize(provider, signer);
const newTxHash = await transactionReplacer.speedUpTransaction(oldTxHash);
```

## Features

- ✅ Transaction status polling
- ✅ Exponential backoff retry
- ✅ Nonce management
- ✅ Gas price optimization
- ✅ Transaction queuing
- ✅ Stuck transaction detection
- ✅ Transaction replacement (speed-up/cancel)

## Usage with PaymentExecutor

All services are automatically integrated into PaymentExecutor:

```typescript
import { paymentExecutor } from '~/services/payment/PaymentExecutor';

// Services are initialized automatically
await paymentExecutor.initialize(provider, signer, contractAddress, abi);

// Transactions now have retry logic and monitoring
const result = await paymentExecutor.executePayment(command, audioBlob);
```

## Components

See `components/transactions/README.md` for UI components.
