"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { LandingPage } from "~~/components/LandingPage";
import { RealPaymentInterface } from "~~/components/voicepay/RealPaymentInterface";

/**
 * Main Home Page
 *
 * Logic:
 * - Not connected: Show Landing Page with wallet connect prompt
 * - Connected: Show Real Voice Payment Interface
 */

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  // Show landing page if wallet not connected
  if (!isConnected) {
    return <LandingPage />;
  }

  // Show real voice payment interface when connected
  return <RealPaymentInterface />;
};

export default Home;
