# ✨ Nuru - Light up your payments

> **Voice-powered crypto remittances for Africa**  
> *Built at ETH Accra 2024 • Ghana first, Nigeria next*

![Nuru Logo](https://img.shields.io/badge/Nuru-Light%20up%20your%20payments-12B76A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)

## 🌍 The Vision

**"Making crypto remittances as natural as conversation"**

Nuru transforms the way Africans send money across borders. Instead of complex wallet addresses, just say "Send 50 cedis to mama.family.eth" and it's done. We're bridging voice-first Africa with crypto-powered finance.

## ✨ Key Features

- **🎤 Voice-First Interface**: Natural language payment commands
- **🌐 ENS Integration**: Send to human-readable names, not 0x addresses
- **⚡ Base L2**: Fast, low-cost transactions optimized for remittances  
- **📱 Mobile Native**: Built for Africa's smartphone-first population
- **💾 Voice Receipts**: Immutable proof stored on Filecoin
- **🔗 Social Verification**: EFP integration for trust and identity

## 🎯 Problem We're Solving

**$50B African remittance market** faces major friction:
- Complex crypto addresses (0x1234...abcd) 
- High fees from traditional providers
- Poor UX for non-technical users
- No voice-optimized interfaces

**Nuru's Solution**: *"Send money to mama"* instead of *"Send to 0x742d35Cc6634C0532925a3b8D35Cc6634C0532925"*

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install the latest version of Scaffold-ETH 2

```
npx create-eth@latest
```

This command will install all the necessary packages and dependencies, so it might take a while.

> [!NOTE]
> You can also initialize your project with one of our extensions to add specific features or starter-kits. Learn more in our [extensions documentation](https://docs.scaffoldeth.io/extensions/).

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network that runs on your local machine and can be used for testing and development. Learn how to [customize your network configuration](https://docs.scaffoldeth.io/quick-start/environment#1-initialize-a-local-blockchain).

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. You can find more information about how to customize your contract and deployment script in our [documentation](https://docs.scaffoldeth.io/quick-start/environment#2-deploy-your-smart-contract).

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

**What's next**:

Visit the [What's next section of our docs](https://docs.scaffoldeth.io/quick-start/environment#whats-next) to learn how to:

- Edit your smart contracts
- Edit your deployment scripts
- Customize your frontend
- Edit the app config
- Writing and running tests
- [Setting up external services and API keys](https://docs.scaffoldeth.io/deploying/deploy-smart-contracts#configuration-of-third-party-services-for-production-grade-apps)

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn all the technical details and guides of Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
