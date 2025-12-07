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

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TailwindCSS
- **Web3**: Wagmi, Viem, Reown AppKit (WalletConnect)
- **Voice**: OpenAI Whisper + GPT-4 for natural language processing
- **Storage**: Filecoin for immutable voice receipt storage
- **Identity**: ENS for human-readable addresses, EFP for social graphs
- **Network**: Base L2 (Sepolia testnet) + Ethereum Mainnet

## 📋 Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 🚀 Quickstart

### 1. Clone and Install

```bash
git clone https://github.com/gboigwe/nuru.git
cd nuru
yarn install
```

### 2. Environment Setup

Create a `.env` file in `packages/nextjs/`:

```bash
# Required: Reown AppKit for wallet connections
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# Required: Alchemy for RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here

# Required for voice features: OpenAI API
OPENAI_API_KEY=your_openai_key_here

# Optional: Filecoin for voice receipts
FILECOIN_SERVICE_PRIVATE_KEY=your_filecoin_key_here
```

**Get your Reown Project ID:**
1. Visit [cloud.reown.com](https://cloud.reown.com)
2. Sign in or create an account
3. Create a new project
4. Copy your Project ID

**Get your Alchemy API Key:**
1. Visit [alchemy.com](https://www.alchemy.com)
2. Create a free account
3. Create a new app (select Base Sepolia network)
4. Copy your API key

### 3. Run Local Development

```bash
# Terminal 1: Start local blockchain (optional for testing)
yarn chain

# Terminal 2: Deploy contracts (optional)
yarn deploy

# Terminal 3: Start Next.js app
yarn start
```

Visit your app at `http://localhost:3000`

### 4. Using Nuru

1. **Connect Wallet**: Click "Connect Wallet" and choose from 300+ supported wallets
2. **Switch Network**: Select Base Sepolia for testing or Mainnet for ENS
3. **Voice Payment**: Click the microphone and say "Send 10 USDC to mama.family.eth"
4. **Confirm**: Review the transaction and approve

## 🔗 Supported Wallets

Nuru uses **Reown AppKit** (formerly WalletConnect) which automatically supports:

- MetaMask
- Coinbase Wallet
- Trust Wallet
- Ledger Live
- Safe Wallet
- Rainbow Wallet
- 300+ WalletConnect-compatible wallets

No manual configuration needed!

## 📚 Documentation

- **[Voice Recognition](./packages/nextjs/services/voice/README.md)** - Multi-tier voice recognition with Web Speech API and Whisper
- **[Reown Migration Guide](./docs/REOWN_MIGRATION.md)** - Complete guide for the RainbowKit to Reown AppKit migration
- **[Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io)** - Technical details and guides
- **[Reown AppKit Docs](https://docs.reown.com/appkit/react/core/installation)** - Wallet connection documentation

## 🏗️ Project Structure

```
nuru/
├── packages/
│   ├── nextjs/          # Next.js frontend app
│   │   ├── app/         # Next.js 15 App Router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # Web3 configuration & voice processing
│   │   └── utils/       # Helper functions
│   └── hardhat/         # Smart contracts & deployment scripts
├── docs/                # Documentation
└── voicepay/           # Voice payment core logic
```

## 🤝 Contributing

We welcome contributions to Nuru! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (use conventional commits)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure `NEXT_PUBLIC_REOWN_PROJECT_ID` is set in your `.env`
- Check browser console for errors
- Try clearing browser cache and reconnecting

### Build Errors
- Run `yarn clean` and `yarn install` to refresh dependencies
- Ensure Node version >= 20.18.3
- Check that all environment variables are set

### Voice Feature Not Working
- Verify `OPENAI_API_KEY` is set
- Check microphone permissions in browser
- Ensure HTTPS connection (required for microphone access)

For more issues, see the [Reown Migration Guide](./docs/REOWN_MIGRATION.md#troubleshooting)

## 📄 License

This project is built on Scaffold-ETH 2 and inherits its MIT License.

## 🙏 Acknowledgments

- Built with [Scaffold-ETH 2](https://scaffoldeth.io)
- Powered by [Reown AppKit](https://reown.com) (formerly WalletConnect)
- Voice processing by [OpenAI](https://openai.com)
- Storage on [Filecoin](https://filecoin.io)
- Identity via [ENS](https://ens.domains) and [EFP](https://ethfollow.xyz)

---

**Built with ❤️ for Africa at ETH Accra 2024**
