/**
 * Wagmi Configuration with Reown AppKit
 *
 * This file configures Web3 wallet connections using Reown AppKit (formerly WalletConnect).
 * Replaces the previous RainbowKit configuration with a more streamlined approach.
 *
 * Key Features:
 * - Automatic wallet support (300+ wallets via WalletConnect Cloud)
 * - No manual connector configuration needed
 * - Featured wallet prioritization (MetaMask, Trust, Coinbase)
 * - Multi-network support (Base Sepolia + Mainnet for ENS)
 * - Server-side rendering (SSR) compatible
 *
 * Required Environment Variables:
 * - NEXT_PUBLIC_REOWN_PROJECT_ID: Get from https://cloud.reown.com
 * - NEXT_PUBLIC_ALCHEMY_API_KEY: Get from https://alchemy.com
 *
 * @see https://docs.reown.com/appkit/react/core/installation
 */

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { Chain, http } from "viem";
import { mainnet } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

/**
 * Enabled blockchain networks
 *
 * We always include Mainnet for:
 * - ENS name resolution (mama.family.eth → 0x...)
 * - ETH price feeds
 * - Social graphs (EFP)
 *
 * Target networks from scaffold.config.ts (typically Base Sepolia for transactions)
 */
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

/**
 * Reown Project ID
 * Get your project ID at https://cloud.reown.com
 * Falls back to walletConnectProjectId from scaffold.config.ts for backward compatibility
 */
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || scaffoldConfig.walletConnectProjectId;

/**
 * RPC Transports Configuration
 *
 * Creates HTTP transport for each enabled chain with:
 * - Custom RPC override support (from scaffold.config.ts)
 * - Alchemy fallback for reliable access
 * - 30-second timeout for stability
 *
 * Priority order:
 * 1. Custom RPC override (if specified in config)
 * 2. Alchemy RPC (if API key provided and not using default)
 * 3. Chain's default public RPC
 */
const transports = enabledChains.reduce(
  (acc, chain) => {
    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];

    // Configure polling interval for each chain
    const pollingInterval = scaffoldConfig.pollingInterval;

    if (rpcOverrideUrl) {
      acc[chain.id] = http(rpcOverrideUrl, { timeout: 30_000 });
    } else {
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      if (alchemyHttpUrl) {
        const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
        // If using default key, use chain's default RPC, otherwise use Alchemy
        const rpcUrl = isUsingDefaultKey ? undefined : alchemyHttpUrl;
        acc[chain.id] = http(rpcUrl, { timeout: 30_000 });
      } else {
        acc[chain.id] = http(undefined, { timeout: 30_000 });
      }
    }

    return acc;
  },
  {} as Record<number, ReturnType<typeof http>>,
);

/**
 * Wagmi Adapter for Reown AppKit
 *
 * This adapter bridges Wagmi (React Hooks for Ethereum) with Reown AppKit.
 * Handles all wallet connections, network switching, and account management.
 *
 * SSR enabled for Next.js 15 App Router compatibility.
 */
export const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId,
  ssr: true,
  transports,
});

/**
 * App Metadata
 * Displayed in wallet connection modals and WalletConnect prompts
 */
const metadata = {
  name: "Nuru",
  description: "Voice-powered crypto remittances for Africa",
  url: typeof window !== "undefined" ? window.location.origin : "https://nuru.app",
  icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "https://nuru.app/logo.png"],
};

/**
 * Featured Wallets
 *
 * These wallet IDs are prioritized in the connection modal for better UX.
 * IDs are public identifiers from Reown's WalletGuide - safe to commit.
 *
 * All 300+ WalletConnect-compatible wallets are still available via search.
 * @see https://walletconnect.com/explorer
 */
const featuredWalletIds = [
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
];

/**
 * Initialize Reown AppKit
 *
 * This must be called at module initialization (not in a React component).
 * Creates the global AppKit instance that powers <appkit-button /> and other components.
 *
 * Note: Burner wallet for testing/development requires custom implementation
 * with Reown AppKit. This will be handled separately.
 */
createAppKit({
  adapters: [wagmiAdapter],
  networks: enabledChains as any,
  projectId,
  metadata,
  featuredWalletIds,
  features: {
    analytics: false, // Disable analytics for privacy
  },
});

/**
 * Wagmi Configuration Export
 * Used by WagmiProvider in ScaffoldEthAppWithProviders
 * Maintains compatibility with existing Wagmi hooks throughout the app
 */
export const wagmiConfig = wagmiAdapter.wagmiConfig;
