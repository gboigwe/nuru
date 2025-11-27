import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { Chain, http } from "viem";
import { mainnet } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || scaffoldConfig.walletConnectProjectId;

// Create transports for each chain with Alchemy fallback and polling configuration
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

// Create WagmiAdapter with Reown
export const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId,
  ssr: true,
  transports,
});

// App metadata for wallet connection
const metadata = {
  name: "Nuru",
  description: "Voice-powered crypto remittances for Africa",
  url: typeof window !== "undefined" ? window.location.origin : "https://nuru.app",
  icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "https://nuru.app/logo.png"],
};

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: enabledChains as any,
  projectId,
  metadata,
  features: {
    analytics: false, // Disable analytics for privacy
  },
});

// Export wagmiConfig for compatibility with existing code
export const wagmiConfig = wagmiAdapter.wagmiConfig;
