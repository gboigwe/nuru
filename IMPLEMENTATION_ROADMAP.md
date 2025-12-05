# Nuru Voice Payment Application - Implementation Roadmap

**Last Updated:** December 4, 2025
**Purpose:** Transform Nuru from a demo/simulation into a fully functional voice-powered payment application built on Coinbase BASE

---

## 🎯 PROJECT OVERVIEW

Nuru is a voice-first crypto remittance application targeting the African market ($50B+ opportunity). Currently, the application uses simulated/fake implementations. This roadmap outlines the tasks needed to build Nuru as a production-ready voice payment app leveraging the BASE ecosystem.

### Current State Analysis
- ✅ Wallet connection infrastructure (Reown AppKit/WalletConnect)
- ✅ Basic UI/UX design
- ✅ Voice command processing logic structure
- ❌ Actual voice recognition (no real speech-to-text)
- ❌ Real blockchain transactions (simulated payments)
- ❌ Smart contract deployment on BASE
- ❌ USDC integration
- ❌ Real ENS resolution
- ❌ Payment execution layer
- ❌ OnchainKit integration

---

## 📋 CRITICAL ISSUES (Priority 1)

### Issue 1: Implement Real Voice Recognition with Web Speech API
**Category:** Core Functionality
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Browser compatibility checks

**Current State:**
- `NuruDemoInterface.tsx` uses fake voice recording with `setTimeout()`
- No actual audio capture or speech-to-text conversion
- Voice commands are randomly selected from `DEMO_COMMANDS` array

**Required Implementation:**
1. Integrate Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
2. Implement fallback to server-side STT (OpenAI Whisper API) for broader browser support
3. Add microphone permission handling
4. Create `AudioRecorder` service class for audio capture
5. Implement real-time transcription with confidence scoring
6. Add noise detection and audio quality validation
7. Handle different accents and languages (English, Twi, Ga, Hausa)

**Files to Create/Modify:**
- Create: `services/audio/AudioRecorder.ts`
- Create: `services/audio/SpeechRecognition.ts`
- Create: `services/audio/WhisperSTT.ts` (fallback)
- Modify: `components/voicepay/VoicePayInterface.tsx`
- Modify: `components/voicepay/NuruDemoInterface.tsx`

**BASE Ecosystem Tools:**
- Use OnchainKit for transaction confirmations
- Consider BASE-specific optimizations for audio data if stored onchain

---

### Issue 2: Deploy VoiceRemittance Smart Contract to BASE Mainnet
**Category:** Smart Contracts
**Status:** Contract exists but not deployed to BASE
**Effort:** High
**Dependencies:** Audited contract, deployment funds

**Current State:**
- Contract exists in `packages/hardhat/contracts/VoiceRemittance.sol`
- Currently deployed to local Hardhat network only
- No BASE mainnet or testnet deployment

**Required Implementation:**
1. Configure Hardhat for BASE network (mainnet: chain ID 8453, testnet: 84532)
2. Add BASE RPC endpoints to `hardhat.config.ts`
3. Audit smart contract for security vulnerabilities
4. Add emergency pause functionality for production
5. Deploy to BASE Sepolia testnet first
6. Test all contract functions on testnet
7. Deploy to BASE mainnet
8. Verify contract on Basescan
9. Update `wagmiConfig.tsx` with deployed contract addresses
10. Set up contract upgrade path (proxy pattern if needed)

**Files to Modify:**
- `packages/hardhat/hardhat.config.ts`
- `packages/hardhat/deploy/01_deploy_voice_remittance.ts`
- `packages/nextjs/services/web3/wagmiConfig.tsx`
- Create: `packages/hardhat/scripts/deploy-base.ts`

**BASE Ecosystem Tools:**
- BASE Sepolia testnet for testing
- Basescan for contract verification
- BASE mainnet RPC via Alchemy or Coinbase Node

---

### Issue 3: Integrate Real USDC Payments on BASE
**Category:** Payments
**Status:** Not Implemented
**Effort:** High
**Dependencies:** Issue #2 (contract deployment)

**Current State:**
- Payments are simulated with fake transaction hashes
- No actual USDC or token transfers
- `PaymentExecutor.ts` has structure but no real execution

**Required Implementation:**
1. Import USDC contract address on BASE (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
2. Add ERC-20 token approval flow before payments
3. Implement actual `transfer()` calls to USDC contract
4. Add gas estimation and balance checks
5. Integrate OnchainKit's `Transaction` component for better UX
6. Handle transaction failures and revert reasons
7. Add transaction status polling and confirmations
8. Implement proper error handling for insufficient funds
9. Add slippage tolerance for currency conversions
10. Store payment receipts onchain or IPFS

**Files to Modify:**
- `services/payment/PaymentExecutor.ts`
- `hooks/useVoicePay.ts`
- `components/voicepay/PaymentConfirmation.tsx`
- Create: `services/payment/USDCPaymentHandler.ts`
- Create: `constants/tokens.ts` (USDC address, decimals, etc.)

**BASE Ecosystem Tools:**
- Native USDC on BASE (not bridged)
- OnchainKit `Transaction` component
- OnchainKit `FundCard` for onboarding users with USDC
- BASE Pay for instant checkout experiences

---

### Issue 4: Fix ENS Resolution for Real Address Lookups
**Category:** Core Functionality
**Status:** Partially Implemented
**Effort:** Medium
**Dependencies:** None

**Current State:**
- ENS service exists but may not be properly connected
- Resolution happens but might not handle all edge cases
- No fallback for non-ENS addresses (regular 0x addresses)

**Required Implementation:**
1. Test ENS resolution with real ENS names on mainnet
2. Add support for BASE-specific name services (Basename)
3. Handle subdomains properly (e.g., `pay.john.eth`)
4. Add caching layer for frequently resolved names
5. Implement reverse ENS lookup (address → name)
6. Add validation for ENS name format
7. Show ENS avatar/profile picture when available
8. Handle expired ENS domains gracefully
9. Support direct 0x address input as fallback
10. Add ENS name suggestion/search feature

**Files to Modify:**
- `services/ens/ENSService.ts`
- `components/voicepay/PaymentConfirmation.tsx`
- Create: `services/ens/BasenameService.ts`
- Create: `hooks/useENSResolver.ts`

**BASE Ecosystem Tools:**
- Basename (BASE's naming service)
- ENS integration via viem/wagmi
- OnchainKit `Identity` component for ENS display

---

### Issue 5: Replace Demo Interface with Real Payment Flow
**Category:** UI/UX
**Status:** Demo Mode Active
**Effort:** High
**Dependencies:** Issues #1, #3, #4

**Current State:**
- `NuruDemoInterface.tsx` is entirely simulated
- Fake payment history with random transaction hashes
- No actual wallet balance checks

**Required Implementation:**
1. Remove all `setTimeout` simulations
2. Connect to real wallet balance via wagmi `useBalance`
3. Display actual USDC balance
4. Show real transaction history from BASE
5. Connect voice recording to real STT service
6. Connect command processing to real payment execution
7. Add loading states for real blockchain interactions
8. Show actual gas fees and confirmation times
9. Add transaction receipts with real tx hashes
10. Link to Basescan for transaction verification

**Files to Modify:**
- Delete: `components/voicepay/NuruDemoInterface.tsx` (or convert to tutorial)
- Enhance: `components/voicepay/VoicePayInterface.tsx`
- Modify: `components/voicepay/PaymentHistory.tsx`
- Modify: `hooks/useVoicePay.ts`

**BASE Ecosystem Tools:**
- OnchainKit `Wallet` component for balance display
- OnchainKit `Transaction` component for tx status
- Basescan API for transaction history

---

## 🔧 HIGH PRIORITY ISSUES (Priority 2)

### Issue 6: Integrate Coinbase OnchainKit Components
**Category:** SDK Integration
**Status:** Package installed but not utilized
**Effort:** Medium
**Dependencies:** None

**Current State:**
- `@coinbase/onchainkit` is installed (v0.38.19 in package.json)
- Not currently used in any components
- Missing out on built-in BASE optimizations

**Required Implementation:**
1. Replace custom wallet connection with OnchainKit `ConnectWallet`
2. Use `Identity` component for user profiles and ENS names
3. Integrate `Transaction` component for payment flows
4. Add `FundCard` component for easy USDC onboarding
5. Use `Checkout` component for streamlined payments
6. Implement `NFTMintCard` for payment receipts/proof
7. Add wallet-based chat using OnchainKit social features
8. Use theme variables for consistent BASE brand

**Files to Create/Modify:**
- Create: `components/onchainkit/` folder for wrapped components
- Modify: `components/WalletConnect/` (replace with OnchainKit)
- Modify: `app/layout.tsx` (add OnchainKit providers)
- Modify: `components/voicepay/PaymentConfirmation.tsx`
- Create: `services/onchainkit/OnchainKitConfig.ts`

**BASE Ecosystem Tools:**
- OnchainKit full suite
- Smart Wallet integration
- Passkey support for easier auth

---

### Issue 7: Add Smart Wallet Support with Passkeys
**Category:** Wallet Experience
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Issue #6

**Current State:**
- Only supports traditional wallet connections
- No email/social login with embedded wallets
- Missing Coinbase Smart Wallet features

**Required Implementation:**
1. Enable OnchainKit Smart Wallet in wagmiConfig
2. Add passkey authentication flow
3. Implement social login (Google, Apple, Discord, Farcaster)
4. Add email magic link authentication
5. Enable gasless transactions where possible
6. Add batch transaction support
7. Implement session keys for better UX
8. Add wallet recovery via social/email
9. Support wallet abstraction (pay with any token)
10. Add sponsored transactions for first-time users

**Files to Modify:**
- `services/web3/wagmiConfig.tsx`
- `components/onboarding/EmailLoginWelcomeFlow.tsx`
- Create: `services/wallet/SmartWalletService.ts`
- Create: `hooks/useSmartWallet.ts`

**BASE Ecosystem Tools:**
- Coinbase Smart Wallet
- Passkey authentication
- OnchainKit wallet connectors
- BASE paymaster for sponsored txs

---

### Issue 8: Implement Proper Currency Conversion
**Category:** Payments
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Issue #3

**Current State:**
- Voice commands mention "cedis" and "dollars" but no conversion
- All payments assumed to be in USDC
- No real exchange rates

**Required Implementation:**
1. Integrate Chainlink Price Feeds for BASE
2. Support GHS (Ghana Cedis) to USDC conversion
3. Add real-time exchange rate display
4. Implement slippage tolerance for conversions
5. Add currency selection UI
6. Support multiple stablecoins (USDC, USDT, DAI on BASE)
7. Show both local currency and crypto amounts
8. Add conversion rate expiry/refresh
9. Handle rate changes during transaction
10. Store preferred currency in user settings

**Files to Create/Modify:**
- Create: `services/currency/CurrencyConverter.ts`
- Create: `services/currency/PriceFeedService.ts`
- Create: `hooks/useCurrencyConversion.ts`
- Modify: `components/voicepay/PaymentConfirmation.tsx`
- Create: `constants/currencies.ts`

**BASE Ecosystem Tools:**
- Chainlink Price Feeds on BASE
- 1inch or Uniswap for token swaps if needed
- OnchainKit for swap UI components

---

### Issue 9: Add Transaction History with Basescan Integration
**Category:** Features
**Status:** Fake/Simulated
**Effort:** Medium
**Dependencies:** Issue #3

**Current State:**
- Transaction history stored in component state only
- Lost on page refresh
- No connection to real blockchain data

**Required Implementation:**
1. Fetch real transaction history from Basescan API
2. Filter transactions by contract address and user address
3. Add pagination for transaction list
4. Store transaction metadata (voice command, notes) in IPFS
5. Link IPFS hash to onchain transaction
6. Show transaction status (pending, confirmed, failed)
7. Add transaction details modal with full info
8. Export transaction history as CSV
9. Add search and filter capabilities
10. Show transaction gas costs and timestamps

**Files to Modify:**
- `components/voicepay/PaymentHistory.tsx`
- Create: `services/blockchain/BasescanService.ts`
- Create: `services/storage/IPFSService.ts`
- Create: `hooks/useTransactionHistory.ts`

**BASE Ecosystem Tools:**
- Basescan API
- The Graph for indexed queries
- IPFS via Web3.Storage or Pinata

---

### Issue 10: Implement Voice Command Natural Language Processing
**Category:** AI/ML
**Status:** Basic parsing only
**Effort:** High
**Dependencies:** None

**Current State:**
- `VoiceCommandProcessor.ts` uses simple regex patterns
- Limited command variations supported
- No context awareness or learning

**Required Implementation:**
1. Integrate OpenAI GPT-4 for intent extraction
2. Train on payment-specific prompts
3. Add context retention across commands
4. Support follow-up questions ("to the same person")
5. Handle ambiguous commands with clarification requests
6. Add multi-language support (English, Twi, Ga, Pidgin)
7. Implement command suggestions based on history
8. Add voice command shortcuts/macros
9. Handle complex commands ("split 100 cedis between john and mary")
10. Add AI-powered error correction

**Files to Modify:**
- `services/voice/VoiceCommandProcessor.ts`
- Create: `services/ai/OpenAIService.ts`
- Create: `services/ai/PromptTemplates.ts`
- Modify: `hooks/useVoicePay.ts`

**BASE Ecosystem Tools:**
- OnchainKit for transaction intents
- BASE-specific command patterns
- OpenAI API for NLP

---

## 🎨 IMPORTANT ENHANCEMENTS (Priority 3)

### Issue 11: Add On-Ramp Integration for USDC Purchases
**Category:** User Onboarding
**Status:** Partially Implemented
**Effort:** Low
**Dependencies:** Issue #6

**Current State:**
- `OnRampButton` component exists
- Not integrated into main payment flow
- No balance check triggers

**Required Implementation:**
1. Show on-ramp prompt when USDC balance insufficient
2. Integrate OnchainKit `FundCard` component
3. Add Coinbase Pay integration
4. Support debit card and bank transfers
5. Add minimum purchase amounts
6. Show purchase confirmation
7. Auto-retry payment after successful onramp
8. Add purchase history
9. Support multiple fiat currencies
10. Handle on-ramp errors gracefully

**Files to Modify:**
- `components/scaffold-eth/InsufficientBalancePrompt.tsx`
- `components/voicepay/PaymentConfirmation.tsx`
- `hooks/useBalanceCheck.ts`

**BASE Ecosystem Tools:**
- OnchainKit `FundCard`
- Coinbase Pay
- BASE Pay integration

---

### Issue 12: Implement Chain Abstraction for Cross-Chain Payments
**Category:** Advanced Features
**Status:** Not Implemented
**Effort:** High
**Dependencies:** Issue #3

**Current State:**
- Only supports payments on BASE
- Cannot send to recipients on other chains

**Required Implementation:**
1. Integrate Reown AppKit Chain Abstraction
2. Auto-detect recipient's preferred chain
3. Add cross-chain bridge integration
4. Support sending to Ethereum, Polygon, Arbitrum
5. Show bridge fees and time estimates
6. Handle bridge transaction failures
7. Add chain suggestion based on gas costs
8. Support multi-chain wallets
9. Add chain-specific ENS resolution
10. Show unified balance across chains

**Files to Create/Modify:**
- Create: `services/bridge/ChainAbstractionService.ts`
- Create: `hooks/useChainAbstraction.ts`
- Modify: `services/payment/PaymentExecutor.ts`
- Modify: `components/voicepay/PaymentConfirmation.tsx`

**BASE Ecosystem Tools:**
- Reown AppKit Chain Abstraction
- LayerZero or Axelar for bridging
- Socket or LiFi APIs

---

### Issue 13: Add Payment Notifications and Webhooks
**Category:** Features
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Issue #3

**Current State:**
- No notifications when payment received
- No way to notify recipients

**Required Implementation:**
1. Add push notifications via Reown WalletKit
2. Implement email notifications for payments
3. Add SMS notifications for recipients without wallets
4. Create webhook system for payment events
5. Add in-app notification center
6. Support notification preferences
7. Add payment reminders
8. Show notifications for transaction confirmations
9. Add notification for received payments
10. Integrate with XMTP for wallet-to-wallet chat

**Files to Create:**
- Create: `services/notifications/NotificationService.ts`
- Create: `services/notifications/WebhookService.ts`
- Create: `components/notifications/NotificationCenter.tsx`
- Create: `hooks/useNotifications.ts`

**BASE Ecosystem Tools:**
- Reown WalletKit notifications
- XMTP for messaging
- OnchainKit social features

---

### Issue 14: Implement Payment Receipts as NFTs
**Category:** Features
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Issue #3

**Current State:**
- No permanent payment receipts
- No proof of payment for recipients

**Required Implementation:**
1. Mint NFT receipt for each payment
2. Include payment metadata (amount, date, voice command)
3. Store receipt on IPFS with image
4. Use ERC-721 or ERC-1155 standard
5. Make receipts transferable for accounting
6. Add receipt gallery/archive view
7. Support receipt export as PDF
8. Add receipt verification system
9. Include tax information in metadata
10. Add receipt templates and customization

**Files to Create:**
- Create: `contracts/PaymentReceiptNFT.sol`
- Create: `services/nft/ReceiptMinter.ts`
- Create: `components/receipts/ReceiptGallery.tsx`
- Create: `services/receipts/ReceiptGenerator.ts`

**BASE Ecosystem Tools:**
- OnchainKit `NFTMintCard`
- BASE low fees for NFT minting
- IPFS for metadata storage
- Thirdweb for NFT infrastructure

---

### Issue 15: Add Analytics Dashboard and Insights
**Category:** Features
**Status:** Not Implemented
**Effort:** Medium
**Dependencies:** Issue #9

**Current State:**
- No spending analytics
- No insights into payment patterns

**Required Implementation:**
1. Create analytics dashboard page
2. Show spending by category, recipient, time
3. Add budget tracking and alerts
4. Visualize payment trends with charts
5. Show savings from using crypto vs traditional remittance
6. Add financial health score
7. Compare user spending to averages
8. Export analytics reports
9. Add recurring payment detection
10. Show gas savings on BASE vs other chains

**Files to Create:**
- Create: `app/analytics/page.tsx`
- Create: `components/analytics/SpendingChart.tsx`
- Create: `components/analytics/InsightCards.tsx`
- Create: `services/analytics/AnalyticsService.ts`
- Create: `hooks/useAnalytics.ts`

**BASE Ecosystem Tools:**
- The Graph for data indexing
- Dune Analytics integration
- BASE transaction data

---

## 🔐 SECURITY & INFRASTRUCTURE (Priority 4)

### Issue 16: Add Comprehensive Error Handling and Recovery
**Category:** Reliability
**Status:** Basic error handling
**Effort:** Medium

**Required Implementation:**
1. Add retry logic for failed transactions
2. Implement transaction confirmation polling
3. Add user-friendly error messages
4. Handle network disconnections gracefully
5. Add transaction cancellation functionality
6. Implement stuck transaction recovery
7. Add RPC fallback providers
8. Handle contract errors properly
9. Add transaction nonce management
10. Implement gas price strategies

---

### Issue 17: Implement Security Best Practices
**Category:** Security
**Status:** Basic security only
**Effort:** High

**Required Implementation:**
1. Add rate limiting for API calls
2. Implement transaction amount limits
3. Add suspicious activity detection
4. Implement wallet verification flow
5. Add 2FA for high-value transactions
6. Add spending limits and controls
7. Implement emergency pause functionality
8. Add audit logging for all actions
9. Implement secure key management
10. Add phishing protection

---

### Issue 18: Add Comprehensive Testing Suite
**Category:** Quality Assurance
**Status:** Minimal testing
**Effort:** High

**Required Implementation:**
1. Write unit tests for all services
2. Add integration tests for payment flows
3. Create E2E tests with Cypress/Playwright
4. Add smart contract tests with Hardhat
5. Test voice recognition accuracy
6. Test ENS resolution edge cases
7. Add load testing for concurrent users
8. Test cross-browser compatibility
9. Add mobile responsiveness testing
10. Implement continuous deployment pipeline

---

### Issue 19: Optimize for Mobile and PWA
**Category:** Mobile Experience
**Status:** Not optimized
**Effort:** Medium

**Required Implementation:**
1. Make app fully responsive for mobile
2. Optimize voice input for mobile devices
3. Add PWA manifest and service worker
4. Enable offline mode for basic features
5. Add mobile wallet deep linking
6. Optimize for iOS Safari and Android Chrome
7. Add mobile-specific UI components
8. Implement swipe gestures
9. Add vibration feedback for actions
10. Optimize bundle size for mobile

---

### Issue 20: Improve Accessibility and Internationalization
**Category:** User Experience
**Status:** Limited accessibility
**Effort:** Medium

**Required Implementation:**
1. Add WCAG 2.1 AA compliance
2. Implement screen reader support
3. Add keyboard navigation
4. Support multiple languages (English, French, Swahili, etc.)
5. Add RTL language support
6. Implement high contrast mode
7. Add font size controls
8. Support voice-only mode for vision-impaired
9. Add captions for audio feedback
10. Create accessibility documentation

---

## 📊 METRICS FOR SUCCESS

### Key Performance Indicators
- [ ] Voice recognition accuracy > 95%
- [ ] Transaction success rate > 99%
- [ ] Average transaction time < 5 seconds
- [ ] Gas costs < $0.01 per transaction on BASE
- [ ] User onboarding time < 2 minutes
- [ ] Mobile performance score > 90
- [ ] Security audit passed with no critical issues
- [ ] Support for 10+ languages
- [ ] 99.9% uptime
- [ ] User satisfaction score > 4.5/5

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Launch
- [ ] All P1 issues resolved
- [ ] Smart contracts audited by reputable firm
- [ ] Security penetration testing completed
- [ ] Legal compliance review (especially for remittances)
- [ ] Privacy policy and terms of service published
- [ ] Customer support system established
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery plan
- [ ] User documentation and FAQ
- [ ] Marketing and launch plan ready

---

## 📖 TECHNICAL STACK SUMMARY

### BASE Ecosystem Tools Used
- **Reown AppKit**: Wallet connections, chain abstraction
- **Coinbase OnchainKit**: Smart wallet, payments, identity
- **BASE Network**: L2 for low-cost transactions
- **USDC on BASE**: Native stablecoin for payments
- **Basescan**: Block explorer and API
- **Basename**: BASE naming service
- **BASE Paymaster**: Sponsored transactions

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity, Hardhat
- **Blockchain**: Wagmi, Viem, Ethers.js
- **Voice**: Web Speech API, OpenAI Whisper
- **AI/NLP**: OpenAI GPT-4
- **Storage**: IPFS, Web3.Storage
- **Indexing**: The Graph, Basescan API

---

## 📞 SUPPORT & RESOURCES

### Documentation Links
- [BASE Documentation](https://docs.base.org)
- [OnchainKit Docs](https://onchainkit.xyz)
- [Reown AppKit Docs](https://docs.reown.com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io)

### Community
- BASE Discord: https://base.org/discord
- OnchainKit GitHub: https://github.com/coinbase/onchainkit
- Reown Discord: https://discord.gg/reown

---

**Note:** This roadmap should be treated as a living document. Issues can be reprioritized based on user feedback, technical discoveries, and market demands. Each issue should be converted into actionable subtasks before implementation begins.
