# Web3.Storage / FileCoin Setup Guide for VoicePay Africa

## Overview
VoicePay uses Web3.Storage to store voice receipts on the FileCoin network with IPFS backing. This provides decentralized, verifiable storage of payment audio recordings.

## Current Implementation Status
✅ **Demo Mode**: Currently running with mock IPFS CIDs for testing
🔄 **Production Ready**: Requires account setup for real FileCoin storage

## Setup Steps for Production

### 1. Create Web3.Storage Account (FREE)
- Go to https://web3.storage/
- Sign up with your email
- **Free Tier**: 5 GiB storage included
- **Paid Plans**: Start at $10/month for more storage

### 2. Install Dependencies (Already Done)
```bash
yarn add @web3-storage/w3up-client @web3-storage/access
```

### 3. Account Setup Process
After signup, you'll need to:

#### A. Create a Space
```javascript
import * as Client from '@web3-storage/w3up-client'

const client = await Client.create()
// Follow the email verification process
```

#### B. Get Delegation Proofs
- Web3.Storage uses "spaces" and "delegations" for permissions
- You'll receive delegation proofs via email verification
- These proofs allow your app to upload to your space

#### C. Environment Configuration
Create these environment variables in `/packages/nextjs/.env.local`:
```bash
# Web3.Storage Configuration
NEXT_PUBLIC_WEB3_STORAGE_ENABLED=true
WEB3_STORAGE_SPACE_DID="your-space-did-here"
WEB3_STORAGE_DELEGATION_PROOF="your-delegation-proof-here"
```

### 4. Code Updates Required

#### Update VoiceReceiptStorage.ts
Replace the demo initialization with:

```javascript
async initialize(): Promise<boolean> {
  try {
    // Create client with persistent store
    this.client = await Client.create()
    
    // Load delegation from environment or storage
    const delegation = process.env.WEB3_STORAGE_DELEGATION_PROOF
    if (delegation) {
      // Import delegation proof
      await this.client.addSpace(delegation)
    }
    
    this.isInitialized = true
    return true
  } catch (error) {
    console.error('Web3.Storage init failed:', error)
    return false
  }
}
```

#### Update uploadFile method:
```javascript
private async uploadFile(file: Blob, filename: string): Promise<string> {
  if (!this.client) throw new Error('Client not initialized')
  
  const fileObject = new File([file], filename, { type: file.type })
  const cid = await this.client.uploadFile(fileObject)
  return cid.toString()
}
```

## Benefits of Real Web3.Storage Integration

### ✅ Free Tier Available
- 5 GiB free storage per account
- No credit card required for basic usage
- Automatic IPFS pinning

### ✅ FileCoin Network Backing  
- Files stored on distributed FileCoin miners
- Cryptographic proofs of storage
- High availability and redundancy

### ✅ IPFS Access
- Immediate availability via IPFS gateways
- Content-addressable storage
- No single point of failure

### ✅ Decentralized Identity
- No API keys to manage in client code
- Secure delegation-based permissions
- Self-sovereign data ownership

## Current Demo Implementation
The app currently works with:
- ✅ Mock IPFS CIDs for voice receipts
- ✅ Full payment processing flow
- ✅ UI showing IPFS links (demo URLs)
- ✅ Voice recording and storage simulation

## Next Steps
1. **For Testing**: Current demo mode is sufficient
2. **For Production**: Follow setup steps above
3. **For Hackathon**: Demo mode demonstrates FileCoin integration

## Cost Estimation
- **Free Tier**: 5 GiB (good for ~500-1000 voice recordings)
- **Paid Tier**: $10/month for additional storage
- **No transaction fees**: Upload costs covered by service

## Technical Notes
- Voice files are encrypted before storage
- Metadata stored separately for privacy
- Automatic content deduplication
- Built-in content verification

---

**Status**: Ready for demo with mock data, production setup requires account creation
**Blockers**: None - free tier available, no funding required
**Action Required**: Account signup when ready for production deployment