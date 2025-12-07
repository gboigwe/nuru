# Changelog

All notable changes to Nuru will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Issue #83: Replace Demo Interface with Real Payment Flow

#### Components
- `RealPaymentInterface` - Main production payment interface
- `VoiceRecorder` - Real voice recording with MediaRecorder API
- `RealBalanceDisplay` - Blockchain balance fetching via wagmi
- `RealPaymentHistory` - Transaction history from smart contract
- `TransactionResult` - Payment execution result display
- `PaymentConfirmationModal` - User confirmation before payment
- `PaymentErrorBoundary` - Error handling wrapper
- `NetworkStatusIndicator` - Network status display
- `LoadingState` components - User feedback during operations

#### Features
- Real microphone access via getUserMedia
- Web Speech API integration for transcription
- Real USDC payments on BASE blockchain
- Transaction verification on Basescan
- Filecoin voice receipt storage with CID
- ENS name resolution
- Real-time balance updates
- Network validation (BASE/BASE Sepolia)
- Comprehensive error handling
- Loading states for all async operations

#### Documentation
- `DEMO_TO_REAL_MIGRATION.md` - Migration guide
- `packages/nextjs/components/voicepay/README.md` - Component documentation
- TypeScript type definitions in `types.ts`
- Updated main README with real payment info

### Changed
- Replaced `NuruDemoInterface` with `RealPaymentInterface` in `app/page.tsx`
- Moved demo interface to `deprecated/` folder for reference

### Removed
- Fake `setTimeout` delays
- Random transaction hash generation
- Hardcoded demo commands
- Simulated payment history
- Mock voice recording
- In-memory payment data

### Breaking Changes
- All operations now require real wallet connection
- Transactions cost real gas fees
- Must be on supported network (BASE/BASE Sepolia)
- Microphone permission required
- HTTPS required for voice recording

## [Previous Versions]

See git history for previous changes.
