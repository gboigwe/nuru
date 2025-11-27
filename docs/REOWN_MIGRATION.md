# Reown AppKit Migration Guide

## Overview

This document outlines the migration from RainbowKit to Reown AppKit (formerly WalletConnect) completed for the Nuru voice-powered crypto remittance application.

**Migration Completed:** November 2024
**Issues Resolved:** #2, #3, #4, #5, #6

---

## What Changed

### Removed Dependencies
- `@rainbow-me/rainbowkit@2.2.8` - Replaced by Reown AppKit

### Added Dependencies
- `@reown/appkit@^1.6.0` - Main AppKit library
- `@reown/appkit-adapter-wagmi@^1.6.0` - Wagmi adapter for Reown

### Updated Dependencies
- `viem@^2.37.9` - Updated for Reown compatibility (from 2.34.0)
- `wagmi@^2.16.4` - Maintained compatibility
- `@tanstack/react-query@^5.59.15` - Maintained

---

## Why We Migrated

1. **WalletConnect Deprecation**: WalletConnect v1 deprecated as of February 17, 2025
2. **Better UX**: Improved wallet connection experience with Reown AppKit
3. **Modern Stack**: Latest Web3 connectivity standards
4. **Active Development**: Ongoing support and updates from Reown team
5. **Security**: Up-to-date wallet security features
6. **Automatic Wallet Support**: No manual connector configuration needed

---

## Key Changes

### 1. Wallet Configuration
**Before (RainbowKit):**
```typescript
// Manual connector configuration required
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";

const connectors = connectorsForWallets([...]);
```

**After (Reown):**
```typescript
// Automatic wallet support via WalletConnect Cloud
import { createAppKit } from "@reown/appkit/react";

createAppKit({
  adapters: [wagmiAdapter],
  networks: [baseSepolia, mainnet],
  projectId: "your_reown_project_id",
  metadata: { name: "Nuru", ... }
});
```

### 2. UI Components
**Before:**
```tsx
import { RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";

<RainbowKitProvider>
  <ConnectButton />
</RainbowKitProvider>
```

**After:**
```tsx
// No provider wrapper needed, just use web components
<appkit-button />
<appkit-network-button />
```

### 3. Custom Styling
**Before:**
```tsx
<RainbowKitProvider theme={darkTheme({ accentColor: '#12B76A' })}>
```

**After:**
```css
/* In globals.css */
appkit-button {
  --wui-color-accent-100: #12B76A;
  --w3m-accent: #12B76A;
}
```

---

## How to Get Reown Project ID

1. Visit [https://cloud.reown.com](https://cloud.reown.com)
2. Sign in or create an account
3. Create a new project
4. Copy your Project ID
5. Add to your `.env` file:
   ```bash
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
   ```

---

## Breaking Changes

### Removed Components
- `RainbowKitCustomConnectButton` → Replaced by `ReownConnectButton`
- `RainbowKitProvider` → No longer needed
- All custom RainbowKit modals (AddressInfoDropdown, NetworkOptions, etc.)

### Updated Components
- `BlockieAvatar` - Now standalone component (no longer tied to RainbowKit)
- `Header` - Uses `ReownConnectButton` instead of `RainbowKitCustomConnectButton`

### Environment Variables
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Still supported as fallback
- `NEXT_PUBLIC_REOWN_PROJECT_ID` - **New preferred variable**

### Burner Wallet
- **Not currently supported** with Reown AppKit
- Requires custom implementation
- Development/testing can use MetaMask or other wallets

---

## Supported Wallets

Reown AppKit automatically supports all major wallets through WalletConnect Cloud:

- ✅ MetaMask
- ✅ Coinbase Wallet
- ✅ Trust Wallet
- ✅ Ledger Live
- ✅ Safe Wallet
- ✅ Rainbow Wallet
- ✅ WalletConnect compatible wallets (300+)

Featured wallets (prioritized in Nuru):
- MetaMask
- Trust Wallet
- Coinbase Wallet

---

## Troubleshooting

### Issue: "Please call createAppKit before using useAppKit hook"
**Solution**: Ensure `wagmiConfig.tsx` is imported before any components use Reown hooks. The config file runs `createAppKit` on initialization.

### Issue: TypeScript errors for `<appkit-button />`
**Solution**: Ensure `types/reown.d.ts` is included in your TypeScript config. This file declares JSX intrinsic elements for Reown components.

### Issue: Wallet modal doesn't open
**Solution**:
1. Check that `NEXT_PUBLIC_REOWN_PROJECT_ID` is set
2. Verify internet connection (Reown requires connection to WalletConnect Cloud)
3. Check browser console for errors

### Issue: Custom styling not applying
**Solution**: Ensure CSS custom properties are set in `globals.css`. Reown uses CSS variables for theming.

### Issue: Network switching not working
**Solution**: Verify both Base Sepolia and Mainnet are configured in `enabledChains` in `wagmiConfig.tsx`.

---

## Testing Checklist

### Wallet Connections
- [ ] MetaMask desktop
- [ ] MetaMask mobile
- [ ] WalletConnect QR code
- [ ] Coinbase Wallet
- [ ] Trust Wallet

### Network Operations
- [ ] Connect to Base Sepolia
- [ ] Switch to Mainnet
- [ ] Switch back to Base Sepolia
- [ ] ENS resolution on Mainnet

### Core Features
- [ ] Voice payment flow
- [ ] Transaction signing
- [ ] Balance display
- [ ] Disconnect wallet

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Performance Impact

- **Bundle size**: ~50KB reduction (RainbowKit removed)
- **Initial load**: Slightly faster (fewer dependencies)
- **Wallet connection**: Similar performance
- **Network switching**: Improved UX with dedicated network button

---

## Migration Summary

| Metric | Before | After |
|--------|--------|-------|
| Dependencies | RainbowKit + Wagmi | Reown AppKit + Wagmi |
| Manual Connectors | Required | Automatic |
| Wallet Support | 7 manual | 300+ automatic |
| Custom Components | 6+ files | 1 file |
| Bundle Size | Larger | Smaller |
| Maintenance | Higher | Lower |

---

## Additional Resources

- [Reown AppKit Documentation](https://docs.reown.com/appkit/react/core/installation)
- [Reown Dashboard](https://cloud.reown.com)
- [WalletConnect Explorer](https://walletconnect.com/explorer)
- [Migration FAQ](https://docs.reown.com/advanced/walletconnect-deprecations)

---

## Support

For issues or questions:
1. Check this migration guide
2. Review [Reown Documentation](https://docs.reown.com)
3. Open an issue on GitHub
4. Check Reown Discord community

---

**Migration Status**: ✅ Complete
**Last Updated**: November 2024
