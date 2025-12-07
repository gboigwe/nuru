# Transaction Monitoring Components

UI components for real-time transaction monitoring.

## Components

### TransactionMonitor

Displays real-time transaction status with actions.

```typescript
import { TransactionMonitor } from '~/components/transactions';

<TransactionMonitor
  txHash="0x..."
  onStatusChange={(status) => console.log(status)}
  onSpeedUp={() => handleSpeedUp()}
  onCancel={() => handleCancel()}
/>
```

**Features:**
- Real-time status updates every 5 seconds
- Confirmation progress bar
- Stuck transaction warning
- Speed up and cancel buttons
- Color-coded status badges

**Status Colors:**
- 🟢 SUCCESS - Green
- 🔴 FAILED - Red
- 🟡 TIMEOUT - Yellow
- 🔵 CONFIRMING - Blue
- ⚪ PENDING - Gray

### TransactionList

Displays multiple transactions with monitoring.

```typescript
import { TransactionList } from '~/components/transactions';

<TransactionList
  transactions={[
    { hash: '0x...', timestamp: Date.now(), amount: '10', recipient: '0x...' }
  ]}
  onSpeedUp={(txHash) => handleSpeedUp(txHash)}
  onCancel={(txHash) => handleCancel(txHash)}
/>
```

**Features:**
- List view of all transactions
- Individual monitoring for each transaction
- Empty state when no transactions
- Batch actions support

## Hooks

### useTransactionMonitor

React hook for transaction monitoring logic.

```typescript
import { useTransactionMonitor } from '~/hooks/useTransactionMonitor';

const {
  status,
  confirmations,
  isStuck,
  error,
  speedUp,
  cancel
} = useTransactionMonitor(txHash);
```

**Returns:**
- `status` - Current transaction status
- `confirmations` - Number of confirmations
- `isStuck` - Whether transaction is stuck
- `error` - Error message if any
- `speedUp()` - Function to speed up transaction
- `cancel()` - Function to cancel transaction

## Integration Example

```typescript
'use client';

import { useState } from 'react';
import { TransactionMonitor } from '~/components/transactions';
import { useTransactionMonitor } from '~/hooks/useTransactionMonitor';

export const PaymentInterface = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const { speedUp, cancel } = useTransactionMonitor(txHash);

  return (
    <div>
      {txHash && (
        <TransactionMonitor
          txHash={txHash}
          onSpeedUp={speedUp}
          onCancel={cancel}
        />
      )}
    </div>
  );
};
```

## Styling

Components use Tailwind CSS classes and are fully responsive.

## Services

See `services/transactions/README.md` for backend services.
