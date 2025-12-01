/**
 * Wagmi Configuration with Reown AppKit
 *
 * This file configures Web3 wallet connections using Reown AppKit (formerly WalletConnect).
 * Replaces the previous RainbowKit configuration with a more streamlined approach.
 *
 * Key Features:
 * - Automatic wallet support (300+ wallets via WalletConnect Cloud)
 * - Email & Social Login (Google, Apple, Discord, Farcaster) for easy onboarding
 * - On-Ramp: Buy crypto directly within the app (essential for remittances)
 * - No manual connector configuration needed
 * - Featured wallet prioritization (MetaMask, Trust, Coinbase)
 * - Multi-network support (Base Sepolia + Mainnet for ENS)
 * - Server-side rendering (SSR) compatible
 * - SIWE (Sign-In with Ethereum) authentication
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
import { mainnet, base } from "viem/chains";
import { SiweMessage } from "siwe";
import { createSIWEConfig } from "@reown/appkit/siwe";
import { appMetadata } from "~~/config/metadata";
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
// SIWE Configuration
const siweConfig = createSIWEConfig({
  // The domain of your app (e.g., 'example.com' or 'localhost:3000' for development)
  domain: typeof window !== 'undefined' ? window.location.host : appMetadata.url.replace(/^https?:\/\//, ''),
  
  // The statement that will be shown in the signature request
  statement: 'Sign in with Ethereum to access your account.',
  
  // Additional options
  options: {
    // 1 hour expiration
    expirationTime: 60 * 60 * 1000,
    // Refresh the session 1 minute before it expires
    refreshInterval: 60 * 1000,
  },
});

export const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId,
  ssr: true,
  transports,
  // Enable SIWE authentication
  authentication: {
    siweConfig,
  },
});

/**
 * App Metadata
 * Displayed in wallet connection modals and WalletConnect prompts
 */
const metadata = {
  name: appMetadata.name,
  description: appMetadata.description,
  url: typeof window !== "undefined" ? window.location.origin : appMetadata.url,
  icons: [typeof window !== "undefined" ? `${window.location.origin}${appMetadata.icon}` : `${appMetadata.url}${appMetadata.icon}`],
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
 * Email & Social Login:
 * Users can now sign in without installing a wallet using:
 * - Email: One-time password (OTP) sent to email
 * - Google: Sign in with Google account
 * - Apple: Sign in with Apple ID
 * - Discord: Sign in with Discord account
 * - Farcaster: Sign in with Farcaster account
 *
 * When users connect via email/social, Reown creates a non-custodial wallet for them
 * that's secured by their authentication method. This significantly improves onboarding
 * for users new to crypto.
 *
 * On-Ramp Feature:
 * Enabled to allow users to buy crypto directly within the app. This is essential for
 * remittance applications like Nuru, where users need to purchase cryptocurrency to
 * send remittances. The on-ramp integrates with various payment providers to enable
 * seamless fiat-to-crypto conversions.
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
    email: true, // Enable email login for easier onboarding
    socials: ['google', 'apple', 'discord', 'farcaster'], // Enable social login options
    emailShowWallets: true, // Show wallet options alongside email login
    onramp: true, // Enable on-ramp feature for buying crypto directly within the app
  },
  // Enable SIWE for authentication
  authentication: {
    siweConfig,
  },
  // Configure Coinbase Smart Wallet
  walletConnect: {
    version: '2',
    qrModal: true,
    // Enable Coinbase Smart Wallet specific features
    coinbase: {
      // Enable smart wallet features
      smartWallet: {
        // Enable sponsored transactions
        sponsorTransactions: true,
        // Enable passkeys for better UX
        enablePasskeys: true,
        // Set default chain to Base for better UX
        defaultChain: base.id,
      },
    },
  },
  // Theme configuration to match Nuru brand identity
  // This replaces CSS overrides in globals.css for a more native integration
  themeVariables: {
    // Nuru brand colors - green accent theme
    '--w3m-accent': '#12B76A', // Primary green accent color
    '--w3m-color-mix': '#0E7A4B', // Darker green for color mixing
    '--w3m-color-mix-strength': 50, // 50% color mix strength
    '--w3m-background': '#ffffff', // Light mode background
    '--wui-color-accent-100': '#12B76A', // Accent color for UI elements
    '--wui-color-accent-090': '#0E7A4B', // Darker accent variant
    
    // Border radius - fully rounded to match Nuru's design
    '--w3m-border-radius-master': '9999px', // Fully rounded borders
    
    // Font configuration
    '--w3m-font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', // System font stack
    '--w3m-font-size-master': '16px', // Base font size
    
    // Dark mode support
    '--w3m-background-color': '#1a1b1f', // Dark mode background
  },
});

/**
 * Wagmi Configuration Export
 * Used by WagmiProvider in ScaffoldEthAppWithProviders
 * Maintains compatibility with existing Wagmi hooks throughout the app
 */
export const wagmiConfig = wagmiAdapter.wagmiConfig;
