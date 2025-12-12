# BASE Mainnet Deployment - Quick Reference

## Current Deployment Status

### BASE Mainnet (Chain ID: 8453)
- **Status**: ✅ DEPLOYED
- **Contract Address**: `0x26aa860EbC8e0cdEcc51A5c2583Ad94b27C62156`
- **Basescan**: https://basescan.org/address/0x26aa860EbC8e0cdEcc51A5c2583Ad94b27C62156
- **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### BASE Sepolia (Chain ID: 84532)
- **Status**: ⏳ PENDING DEPLOYMENT
- **USDC Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## Quick Start

### 1. Deploy to BASE Sepolia (Testnet)

```bash
# Set up environment
cp .env.example .env
# Edit .env with your keys

# Compile contracts
yarn compile

# Run tests
yarn test

# Deploy
yarn deploy --network baseSepolia

# Verify deployment
CONTRACT_ADDRESS=0x... yarn hardhat run scripts/verify-deployment.ts --network baseSepolia
```

### 2. Deploy to BASE Mainnet (Production)

⚠️ **WARNING: PRODUCTION DEPLOYMENT - REAL FUNDS AT RISK**

```bash
# Complete security checklist first!
# See SECURITY_AUDIT.md

# Deploy with safety checks
yarn deploy --network base

# Verify ownership transferred to multisig
CONTRACT_ADDRESS=0x... yarn hardhat run scripts/verify-deployment.ts --network base
```

---

## Important Files

- `DEPLOYMENT.md` - Comprehensive deployment guide
- `SECURITY_AUDIT.md` - Security checklist (complete before mainnet)
- `.env.example` - Environment variables template
- `deploy/01_deploy_base_sepolia.ts` - Sepolia deployment script
- `deploy/02_deploy_base_mainnet.ts` - Mainnet deployment script
- `scripts/verify-deployment.ts` - Post-deployment verification
- `scripts/update-frontend.ts` - Frontend update helper

---

## Network Configuration

### BASE Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### BASE Sepolia
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

---

## Pre-Deployment Checklist

### Testnet (BASE Sepolia)
- [ ] Environment variables configured
- [ ] Deployer wallet has test ETH
- [ ] Tests passing
- [ ] Basescan API key set

### Mainnet (BASE)
- [ ] ✅ Security audit completed
- [ ] ✅ Testnet deployment successful
- [ ] ✅ Multisig wallet configured
- [ ] ✅ Team sign-off
- [ ] Deployer wallet has sufficient ETH (0.05+)
- [ ] Emergency procedures documented
- [ ] Monitoring configured

---

## Post-Deployment Tasks

1. **Verify Contract**
   ```bash
   yarn hardhat verify --network base <ADDRESS>
   ```

2. **Update Frontend**
   - Edit `packages/nextjs/contracts/deployedContracts.ts`
   - Add contract address for appropriate chain ID
   - Run `yarn hardhat run scripts/update-frontend.ts`

3. **Test Deployment**
   - Perform test transaction
   - Verify voice receipt creation
   - Check NFT minting

4. **Configure Monitoring**
   - Set up alerts for large transactions
   - Monitor error rates
   - Track contract events

5. **Announce**
   - Notify team
   - Update documentation
   - Communicate to users

---

## Troubleshooting

### "Insufficient funds for gas"
- Get more ETH from faucet (testnet) or fund wallet (mainnet)

### "Contract verification failed"
- Check Basescan API key in `.env`
- Verify compiler version matches (0.8.20)
- Try manual verification

### "Nonce too high"
- Wait a few minutes and retry
- Or reset nonce (advanced users only)

---

## Security Notes

⚠️ **NEVER commit `.env` file to git**

⚠️ **Mainnet deployments require multisig wallet**

⚠️ **Complete security audit before mainnet deployment**

⚠️ **Test thoroughly on testnet first**

---

## Support & Resources

- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Security Checklist**: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Hardhat Docs**: https://hardhat.org/docs
- **BASE Docs**: https://docs.base.org/
- **Basescan**: https://basescan.org/

---

**Last Updated**: 2025-12-12
**Contract Version**: 1.0.0
**Solidity Version**: 0.8.20
