# VoiceRemittance BASE Deployment Guide

This guide provides step-by-step instructions for deploying the VoiceRemittance smart contract to BASE Sepolia testnet and BASE Mainnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Checklist](#security-checklist)
4. [BASE Sepolia Deployment (Testnet)](#base-sepolia-deployment)
5. [BASE Mainnet Deployment (Production)](#base-mainnet-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js (v18+)
- Yarn package manager
- Hardhat
- MetaMask or hardware wallet
- Basescan API key

### Required Accounts
- Deployer wallet with ETH for gas
- Multisig wallet address (mainnet only)
- Basescan account for verification

### Minimum Balances
- **BASE Sepolia**: 0.01 ETH (get from [BASE Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
- **BASE Mainnet**: 0.05 ETH for safe deployment

---

## Environment Setup

### 1. Copy Environment Template

```bash
cd packages/hardhat
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# CRITICAL: Keep this file secure and NEVER commit it to git

# Deployer Private Key
__RUNTIME_DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC Endpoints
ALCHEMY_API_KEY=your_alchemy_api_key
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Block Explorer API Keys
BASESCAN_API_KEY=your_basescan_api_key

# USDC Token Addresses
USDC_TOKEN_ADDRESS_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_TOKEN_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Mainnet Configuration (PRODUCTION)
FEE_RECEIVER_ADDRESS_MAINNET=your_multisig_wallet_address
MULTISIG_WALLET_ADDRESS=your_multisig_wallet_address

# Testnet Configuration
FEE_RECEIVER_ADDRESS_TESTNET=your_test_wallet_address
```

### 3. Get API Keys

#### Alchemy API Key (Optional but Recommended)
1. Sign up at [Alchemy.com](https://www.alchemy.com/)
2. Create a new app for BASE
3. Copy the API key

#### Basescan API Key (Required for Verification)
1. Sign up at [Basescan.org](https://basescan.org/)
2. Go to API Keys section
3. Create a new API key
4. Copy the key

### 4. Verify Configuration

```bash
# Check network connectivity
yarn hardhat --network baseSepolia run scripts/check-network.ts

# Verify deployer balance
yarn hardhat --network baseSepolia run scripts/check-balance.ts
```

---

## Security Checklist

**⚠️ CRITICAL: Complete the security checklist before ANY deployment**

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for the comprehensive checklist.

### Minimum Requirements Before Mainnet:
- [x] Contract audited by internal team
- [ ] External security audit completed
- [ ] All tests passing (100% coverage)
- [ ] Successful testnet deployment
- [ ] Multisig wallet configured
- [ ] Emergency procedures documented

---

## BASE Sepolia Deployment

### Step 1: Compile Contracts

```bash
cd packages/hardhat
yarn compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

### Step 2: Run Tests

```bash
yarn test
```

Ensure all tests pass before proceeding.

### Step 3: Deploy to BASE Sepolia

```bash
yarn deploy --network baseSepolia
```

Expected output:
```
============================================================
🔷 BASE SEPOLIA TESTNET DEPLOYMENT
============================================================
📍 Network: baseSepolia
🔗 Chain ID: 84532
👤 Deployer: 0x...

📋 Deployment Configuration:
   USDC Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
   Fee Receiver: 0x...

🚀 Deploying VoiceRemittance contract...
✅ VoiceRemittance deployed to: 0x...

📊 Contract Information:
   Address: 0x...
   Owner: 0x...
   Total Orders: 0
   Platform Fee: 0.5%

🔍 Verifying contract on Basescan...
✅ Contract verified on Basescan

============================================================
✅ BASE SEPOLIA DEPLOYMENT COMPLETED
============================================================
```

### Step 4: Save Deployment Info

Copy the deployment info JSON and save it securely:
- Contract address
- Deployer address
- Basescan URL
- Timestamp

### Step 5: Test on Sepolia

1. **Verify on Basescan**
   - Visit the Basescan URL from deployment output
   - Check that contract is verified
   - Review contract source code

2. **Test Basic Functions**
   ```bash
   # Test creating a payment order
   yarn hardhat run scripts/test-payment.ts --network baseSepolia
   ```

3. **Frontend Integration Test**
   - Update frontend with contract address
   - Test voice payment flow
   - Verify receipts generation

---

## BASE Mainnet Deployment

### ⚠️ WARNING: PRODUCTION DEPLOYMENT

This section deploys to MAINNET with REAL FUNDS at risk. Triple-check everything!

### Pre-Flight Checklist

- [ ] Security audit completed and approved
- [ ] All tests passing on testnet
- [ ] Multisig wallet configured and tested
- [ ] Team notified about deployment
- [ ] Emergency procedures documented
- [ ] Monitoring alerts configured
- [ ] At least 0.05 ETH in deployer wallet

### Step 1: Final Security Review

Review [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) one more time. Get sign-off from:
- Technical Lead
- Security Lead
- Project Manager

### Step 2: Configure Mainnet Environment

Double-check your `.env`:
```bash
# Verify these values carefully
MULTISIG_WALLET_ADDRESS=0x... # Your multisig wallet
FEE_RECEIVER_ADDRESS_MAINNET=0x... # Same as multisig
BASESCAN_API_KEY=... # Your Basescan API key
```

### Step 3: Compile with Production Settings

```bash
yarn compile
```

### Step 4: Deploy to BASE Mainnet

```bash
yarn deploy --network base
```

**You will see warnings:**
```
🚨 BASE MAINNET DEPLOYMENT - PRODUCTION
⚠️  WARNING: This is a MAINNET deployment!
⚠️  Real funds will be at risk. Proceed with extreme caution.
```

### Step 5: Monitor Deployment

The deployment will:
1. Deploy VoiceRemittance contract
2. Configure USDC token address
3. Transfer ownership to multisig wallet
4. Verify contract on Basescan

This process takes 5-10 minutes due to confirmation requirements.

### Step 6: Verify Deployment

```bash
# Check contract on Basescan
open https://basescan.org/address/<CONTRACT_ADDRESS>

# Verify ownership transferred to multisig
yarn hardhat run scripts/check-ownership.ts --network base
```

---

## Post-Deployment

### 1. Update Frontend

Update `packages/nextjs/contracts/deployedContracts.ts`:

```typescript
export const deployedContracts = {
  8453: {
    VoiceRemittance: {
      address: "0xYOUR_DEPLOYED_ADDRESS",
      abi: [...],
    },
  },
  84532: {
    VoiceRemittance: {
      address: "0xYOUR_TESTNET_ADDRESS",
      abi: [...],
    },
  },
};
```

### 2. Configure Monitoring

Set up monitoring for:
- Contract events
- Large transactions
- Error rates
- Pause events

### 3. Test Production Contract

```bash
# Run smoke tests
yarn hardhat run scripts/smoke-test.ts --network base

# Test with small amount first (< $10)
```

### 4. Document Deployment

Create deployment record with:
- Contract address
- Deployment date
- Deployer address
- Multisig wallet
- Basescan verification link
- Initial configuration
- Team sign-offs

### 5. Announce Deployment

Notify:
- Development team
- Project stakeholders
- Users (via official channels)

---

## Troubleshooting

### Deployment Fails with "Insufficient Funds"

**Solution:**
```bash
# Check deployer balance
yarn hardhat run scripts/check-balance.ts --network baseSepolia

# Get testnet ETH from faucet
# https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### Contract Verification Fails

**Solution:**
```bash
# Manually verify
yarn hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# If still fails, check Basescan API key
echo $BASESCAN_API_KEY
```

### "Nonce Too High" Error

**Solution:**
```bash
# Reset account nonce (DANGER: Only if you know what you're doing)
# Or wait a few minutes and retry
```

### Ownership Transfer Fails

**Solution:**
```bash
# Verify multisig address is correct
# Ensure multisig wallet can receive ownership
# Check multisig is not a contract without transferOwnership support
```

### USDC Token Address Wrong

**Solution:**
- BASE Mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- BASE Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Verify on Basescan before deployment.

---

## Deployment Commands Reference

```bash
# Compile contracts
yarn compile

# Run tests
yarn test

# Deploy to BASE Sepolia
yarn deploy --network baseSepolia

# Deploy to BASE Mainnet (with warnings)
yarn deploy --network base

# Verify contract
yarn hardhat verify --network baseSepolia <ADDRESS>

# Check network
yarn hardhat --network baseSepolia run scripts/check-network.ts

# Get contract info
yarn hardhat --network baseSepolia run scripts/contract-info.ts
```

---

## Emergency Procedures

### If You Need to Pause the Contract

```bash
# From multisig wallet
yarn hardhat run scripts/emergency-pause.ts --network base
```

### If There's a Critical Bug

1. Pause contract immediately
2. Notify all stakeholders
3. Assess impact and fund safety
4. Plan fix or migration
5. Communicate with users

### Fund Recovery

Only possible during emergency shutdown with configured delay period.

---

## Support

For deployment issues:
- Check [Hardhat Docs](https://hardhat.org/docs)
- Check [BASE Docs](https://docs.base.org/)
- Contact team lead

For security concerns:
- DO NOT post publicly
- Contact security@[your-domain].com
- Follow incident response plan

---

**Last Updated:** [Date]
**Maintained By:** [Team Name]
