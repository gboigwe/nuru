# 🔄 Reown AppKit Migration Roadmap

> **Mission:** Migrate Nuru from RainbowKit to Reown AppKit (formerly WalletConnect) for modern, future-proof wallet connectivity.

## 📊 Migration Overview

**Timeline:** 5 focused issues, each with substantial PRs
**Deadline:** February 17, 2025 (WalletConnect v1 deprecation)
**Epic Issue:** [#1](https://github.com/gboigwe/nuru/issues/1)

---

## 🎯 Issues Breakdown

### ✅ [Issue #1](https://github.com/gboigwe/nuru/issues/2): Package Migration & Dependency Updates

**Difficulty:** Easy
**Time Estimate:** 1-2 hours
**Good For:** First-time contributors
**Expected Commits:** 3-5

#### What to Do:
1. Remove `@rainbow-me/rainbowkit` from package.json
2. Remove RainbowKit CSS import from `app/layout.tsx`
3. Install `@reown/appkit` and `@reown/appkit-adapter-wagmi`
4. Update package-lock.json
5. Verify build still works

#### Key Files:
- `/packages/nextjs/package.json`
- `/packages/nextjs/app/layout.tsx`

#### Success Criteria:
- ✅ RainbowKit removed
- ✅ Reown packages installed
- ✅ Build passes (`npm run build`)
- ✅ No dependency conflicts

---

### ⚙️ [Issue #2](https://github.com/gboigwe/nuru/issues/3): Core Provider & Configuration Setup

**Difficulty:** Medium
**Time Estimate:** 3-4 hours
**Good For:** Intermediate contributors
**Expected Commits:** 5-8

#### What to Do:
1. Create `WagmiAdapter` using Reown
2. Configure networks (Base Sepolia + Mainnet for ENS)
3. Set up `createAppKit` with project metadata
4. Replace `RainbowKitProvider` with Reown provider
5. Enable SSR support
6. Preserve existing Alchemy RPC configuration
7. Add environment variable documentation

#### Key Files:
- `/packages/nextjs/services/web3/wagmiConfig.tsx`
- `/packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`
- `/packages/nextjs/scaffold.config.ts`
- `.env.example`

#### Success Criteria:
- ✅ WagmiAdapter configured correctly
- ✅ AppKit initialized with proper metadata
- ✅ Base Sepolia + Mainnet working
- ✅ SSR enabled
- ✅ Existing RPC settings preserved

---

### 🔌 [Issue #3](https://github.com/gboigwe/nuru/issues/4): Wallet Connector Migration

**Difficulty:** Medium
**Time Estimate:** 2-3 hours
**Good For:** Intermediate contributors
**Expected Commits:** 4-6

#### What to Do:
1. Research Reown's wallet connector approach
2. Remove RainbowKit `connectorsForWallets` usage
3. Configure wallets through Reown AppKit
4. Migrate burner wallet for development/testing
5. Ensure all wallet types are accessible
6. Test each wallet connection

#### Wallet Types to Support:
- MetaMask
- WalletConnect
- Coinbase Wallet
- Ledger
- Safe Wallet
- Burner Wallet (dev mode)

#### Key Files:
- `/packages/nextjs/services/web3/wagmiConnectors.tsx` (refactor or remove)

#### Success Criteria:
- ✅ All wallet types accessible
- ✅ MetaMask works
- ✅ WalletConnect modal works
- ✅ Burner wallet available for testing

---

### 🎨 [Issue #4](https://github.com/gboigwe/nuru/issues/5): UI Component Refactoring

**Difficulty:** Medium-High
**Time Estimate:** 4-6 hours
**Good For:** Frontend developers
**Expected Commits:** 8-12

#### What to Do:
1. Replace RainbowKit connect button with `<appkit-button />`
2. Migrate custom account dropdown components
3. Update Header wallet UI
4. Refactor address display and QR code modal
5. Implement network switching UI
6. Style Reown components to match Nuru branding (#12B76A green)
7. Ensure mobile responsiveness
8. Remove all RainbowKit component imports

#### Key Files:
- `/packages/nextjs/components/scaffold-eth/RainbowKitCustomConnectButton/`
  - `index.tsx`
  - `AddressInfoDropdown.tsx`
  - `NetworkOptions.tsx`
  - `AddressQRCodeModal.tsx`
  - `WrongNetworkDropdown.tsx`
- `/packages/nextjs/components/Header.tsx`
- `/packages/nextjs/components/voicepay/VoicePayInterface.tsx`

#### Success Criteria:
- ✅ Connect button shows wallet options
- ✅ Account modal displays correctly
- ✅ Balance visible
- ✅ Network switching works
- ✅ QR code modal functional
- ✅ Theme matches Nuru branding
- ✅ Mobile responsive

---

### ✅ [Issue #5](https://github.com/gboigwe/nuru/issues/6): Testing, Documentation & Completion

**Difficulty:** Medium
**Time Estimate:** 3-5 hours
**Good For:** QA-minded contributors
**Expected Commits:** 5-7

#### What to Do:

**Testing:**
1. Test all wallet connections (MetaMask, WalletConnect, Coinbase, etc.)
2. Test network switching (Base Sepolia ↔ Mainnet)
3. Test voice payment end-to-end flow
4. Test ENS resolution
5. Browser compatibility testing
6. Mobile device testing

**Documentation:**
1. Update README.md with Reown setup instructions
2. Create `.env.example` with all required variables
3. Write `REOWN_MIGRATION.md` guide in `/docs`
4. Update CONTRIBUTING.md
5. Add code comments explaining configuration

**Performance:**
1. Measure wallet connection time
2. Check bundle size impact
3. Verify no memory leaks
4. Test with slow network

#### Key Files:
- `/README.md`
- `/.env.example`
- `/docs/REOWN_MIGRATION.md` (new)
- `/docs/CONTRIBUTING.md`

#### Success Criteria:
- ✅ All wallet types tested and working
- ✅ Voice payment flow works end-to-end
- ✅ Documentation complete and accurate
- ✅ Migration guide published
- ✅ No functionality regressions
- ✅ Performance maintained/improved

---

## 🚀 Getting Started

### For Contributors:

1. **Choose an issue** based on your skill level
2. **Comment on the issue** to claim it
3. **Fork the repository**
4. **Create a feature branch:** `git checkout -b feat/reown-issue-X`
5. **Make focused commits** (see expected commit count per issue)
6. **Test thoroughly** before submitting PR
7. **Reference the issue** in your PR: "Closes #X"

### Commit Message Format:

```
<type>: <description>

Examples:
- chore: remove RainbowKit dependency
- feat: add Reown AppKit provider configuration
- refactor: migrate connect button to Reown
- docs: update README with Reown setup
- test: add wallet connection tests
```

---

## 📚 Resources

- [Reown AppKit Documentation](https://docs.reown.com/appkit/react/core/installation)
- [Reown Migration Guide](https://docs.reown.com/advanced/walletconnect-deprecations)
- [Get Reown Project ID](https://dashboard.reown.com)
- [Reown GitHub](https://github.com/reown-com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

---

## 🎯 Why This Migration Matters

1. **Future-Proof:** WalletConnect v1 deprecated February 2025
2. **Better UX:** Improved wallet connection experience
3. **Modern Stack:** Latest Web3 connectivity standards
4. **Active Development:** Ongoing support from Reown team
5. **Security:** Up-to-date wallet security features
6. **Compliance:** Meets latest wallet standards

---

## 🏆 Contributor Recognition

All contributors to this migration will be recognized in:
- Project README contributors section
- Special mention in release notes
- Contributor documentation

Each issue represents **significant, valuable work** that demonstrates:
- Web3 integration expertise
- Modern React patterns
- Dependency management skills
- UI/UX refactoring ability
- Testing and documentation excellence

---

## ❓ Questions?

- Check the [Epic Issue #1](https://github.com/gboigwe/nuru/issues/1)
- Comment on specific issue for clarification
- Review Reown documentation
- Join project discussions

---

**Last Updated:** November 26, 2024
**Status:** Ready for contributors
**Progress:** 0/5 issues completed
