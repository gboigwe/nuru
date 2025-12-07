# Demo to Real Payment Flow Migration Guide

This document outlines the migration from NuruDemoInterface to RealPaymentInterface.

## Overview

Issue #83 replaced the simulated demo interface with real blockchain payment functionality.

## What Changed

### Removed (Demo Features)
- ❌ `setTimeout` fake delays
- ❌ `Math.random()` transaction hashes
- ❌ Hardcoded `DEMO_COMMANDS` array
- ❌ Fake balance displays
- ❌ Simulated payment history in state
- ❌ Mock voice recording
- ❌ In-memory payment data (lost on refresh)

### Added (Real Features)
- ✅ Real wallet integration via wagmi
- ✅ Real MediaRecorder API for voice capture
- ✅ Real Web Speech API for transcription
- ✅ Real USDC payments on BASE
- ✅ Real transaction history from smart contract
- ✅ Real balance fetching from blockchain
- ✅ Filecoin voice receipt storage
- ✅ ENS name resolution
- ✅ Basescan transaction verification
- ✅ Error boundaries and proper error handling
- ✅ Network status indicators
- ✅ Loading states for async operations

## Component Mapping

| Demo Component | Real Component | Purpose |
|---------------|----------------|---------|
| NuruDemoInterface | RealPaymentInterface | Main interface |
| Fake recording | VoiceRecorder | Real audio capture |
| Hardcoded balance | RealBalanceDisplay | Blockchain balance |
| State payments | RealPaymentHistory | Contract history |
| - | TransactionResult | Transaction feedback |
| - | PaymentConfirmationModal | User confirmation |
| - | PaymentErrorBoundary | Error handling |
| - | NetworkStatusIndicator | Network status |

## Migration Steps

### 1. Update Imports
```tsx
// Before
import { NuruDemoInterface } from '~/components/voicepay/NuruDemoInterface';

// After
import { RealPaymentInterface } from '~/components/voicepay/RealPaymentInterface';
```

### 2. Replace Component
```tsx
// Before
<NuruDemoInterface />

// After
<RealPaymentInterface />
```

### 3. Ensure Wallet Connection
RealPaymentInterface requires wallet connection:
```tsx
const { isConnected } = useAccount();

if (!isConnected) {
  return <LandingPage />;
}

return <RealPaymentInterface />;
```

### 4. Configure Environment
Ensure these environment variables are set:
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
OPENAI_API_KEY=your_openai_key
```

## Testing Checklist

- [ ] Wallet connects successfully
- [ ] Real balance displays correctly
- [ ] Voice recording captures audio
- [ ] Speech recognition transcribes voice
- [ ] Payment confirmation shows correct details
- [ ] Transaction executes on blockchain
- [ ] Transaction hash appears on Basescan
- [ ] Payment history loads from contract
- [ ] Voice receipt stores on Filecoin
- [ ] Error handling works properly
- [ ] Network indicator shows correct chain
- [ ] Loading states display during operations

## Breaking Changes

1. **No Demo Mode**: All operations are real and require wallet connection
2. **Network Required**: Must be on BASE or BASE Sepolia
3. **Gas Fees**: Real transactions cost gas
4. **Microphone Permission**: Browser must allow microphone access
5. **HTTPS Required**: Voice recording requires secure context

## Rollback Plan

If issues occur, the demo interface is preserved at:
```
packages/nextjs/components/voicepay/deprecated/NuruDemoInterface.tsx
```

To rollback:
```tsx
import { NuruDemoInterface } from '~/components/voicepay/deprecated/NuruDemoInterface';
```

## Support

For issues related to this migration:
- Check [GitHub Issue #83](https://github.com/gboigwe/nuru/issues/83)
- Review component README: `packages/nextjs/components/voicepay/README.md`
- Check error logs in browser console

## Next Steps

After migration:
1. Test on BASE Sepolia testnet
2. Verify all transactions on Basescan
3. Test voice recording in different browsers
4. Validate ENS resolution
5. Test error scenarios
6. Deploy to production on BASE Mainnet
