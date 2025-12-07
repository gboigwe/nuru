# Nuru Voice Payment Subgraph

The Graph subgraph for indexing Nuru Voice Payment transactions on BASE Mainnet.

## Overview

This subgraph indexes all `VoiceRemittance` contract events to provide:
- Fast transaction history queries
- Payment analytics and statistics
- User reputation tracking
- Daily volume metrics
- Currency-specific analytics

## Entities

### Payment
Individual payment transactions with full details including sender, recipient, amount, voice hash, and status.

### User
Aggregated user statistics including total sent/received amounts, payment counts, and reputation scores.

### DailyStat
Daily aggregated metrics including volume, payment counts, and averages.

### ProtocolStat
Global protocol statistics (singleton entity).

### CurrencyStat
Per-currency aggregated statistics.

## Deployment

### Prerequisites
```bash
# Install Graph CLI globally
npm install -g @graphprotocol/graph-cli

# Or use from node_modules
yarn add @graphprotocol/graph-cli @graphprotocol/graph-ts
```

### Build and Deploy

1. **Generate Code**
```bash
yarn codegen
```

2. **Build Subgraph**
```bash
yarn build
```

3. **Deploy to The Graph Studio**
```bash
# First, authenticate
graph auth --studio <DEPLOY_KEY>

# Then deploy
yarn deploy
```

### Local Development

1. **Start Graph Node locally**
```bash
# Clone graph-node
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker

# Start services
docker-compose up
```

2. **Create local subgraph**
```bash
yarn create-local
```

3. **Deploy locally**
```bash
yarn deploy:local
```

## Queries

### Get Recent Payments
```graphql
query RecentPayments {
  payments(
    first: 10
    orderBy: initiatedAt
    orderDirection: desc
  ) {
    id
    sender
    recipient
    amount
    status
    initiatedAt
  }
}
```

### Get User Statistics
```graphql
query UserStats($address: Bytes!) {
  user(id: $address) {
    totalSent
    totalReceived
    paymentsSentCount
    paymentsReceivedCount
    reputation
  }
}
```

### Get Protocol Statistics
```graphql
query ProtocolStats {
  protocolStat(id: "1") {
    totalVolumeAllTime
    totalPaymentsAllTime
    totalFeesAllTime
    averagePaymentAmount
  }
}
```

## Contract Address

**BASE Mainnet**: `0x26aa860EbC8e0cdEcc51A5c2583Ad94b27C62156`

**Start Block**: `22800000`

## Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [Graph Studio](https://thegraph.com/studio/)
