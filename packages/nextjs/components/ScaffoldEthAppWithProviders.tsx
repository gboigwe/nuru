/**
 * Scaffold-ETH App Providers
 *
 * This is the root provider component that wraps the entire Next.js app.
 * Sets up all necessary Web3 and UI providers for the application.
 *
 * Provider Stack (outside → inside):
 * 1. WagmiProvider - Web3 wallet connections via Reown AppKit
 * 2. QueryClientProvider - React Query for async state management
 * 3. ScaffoldEthApp - App layout with header/footer
 *
 * Previously included RainbowKitProvider, now removed in favor of Reown AppKit.
 * Reown is initialized in wagmiConfig.tsx and doesn't need a provider wrapper.
 */

"use client";

import { usePathname } from "next/navigation";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import "@coinbase/onchainkit/styles.css";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  const pathname = usePathname();

  // Hide header/footer for main Nuru demo, show for debug pages
  const isMainDemo = pathname === "/";
  const showHeaderFooter = !isMainDemo;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {showHeaderFooter && <Header />}
        <main className="relative flex flex-col flex-1">{children}</main>
        {showHeaderFooter && <Footer />}
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={base}
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        >
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
