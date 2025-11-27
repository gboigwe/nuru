"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { LandingPage } from "~~/components/LandingPage";
import { NuruDemoInterface } from "~~/components/voicepay/NuruDemoInterface";

/**
 * Main Home Page
 *
 * Logic:
 * - Not connected: Show Landing Page with wallet connect prompt
 * - Connected: Show Voice Payment Interface (NuruDemoInterface)
 */

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  // Show landing page if wallet not connected
  if (!isConnected) {
    return <LandingPage />;
  }

  // Show voice payment interface when connected
  return <NuruDemoInterface />;
};

export default Home;
