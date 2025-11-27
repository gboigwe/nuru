"use client";

import { useAccount } from "wagmi";
import { WalletConnectModal } from "./WalletConnect";
import { SparklesIcon, MicrophoneIcon, GlobeAltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

/**
 * Landing Page for Nuru
 *
 * Shows before wallet connection
 * Prompts users to connect wallet to access the voice payment app
 */

export const LandingPage = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo & Title */}
        <div className="text-center mb-12 animate-slideUp">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#12B76A] to-[#0E7A4B] rounded-3xl shadow-2xl mb-6">
            <span className="text-5xl">✨</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-[#0E7A4B] to-[#12B76A] bg-clip-text text-transparent">
            Nuru
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-[#12B76A] mb-3">
            Light up your payments
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Send crypto remittances as naturally as conversation. Just say "Send 50 cedis to mama" and it's done.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-12 h-12 bg-[#12B76A]/10 rounded-xl flex items-center justify-center mb-4">
              <MicrophoneIcon className="w-6 h-6 text-[#12B76A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Voice-First</h3>
            <p className="text-sm text-gray-600">
              Natural language payment commands. No complex addresses needed.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-12 h-12 bg-[#12B76A]/10 rounded-xl flex items-center justify-center mb-4">
              <GlobeAltIcon className="w-6 h-6 text-[#12B76A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">ENS Integration</h3>
            <p className="text-sm text-gray-600">
              Send to human-readable names like "mama.family.eth"
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-12 h-12 bg-[#12B76A]/10 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-[#12B76A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Secure & Fast</h3>
            <p className="text-sm text-gray-600">
              Built on Base L2 for low fees and instant transactions
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-green-200">
            <SparklesIcon className="w-12 h-12 text-[#12B76A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start making voice-powered crypto payments
            </p>

            {/* Wallet Connect Button */}
            <div className="flex justify-center">
              <WalletConnectModal />
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Supports MetaMask, Coinbase Wallet, Trust Wallet, and 300+ more
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
          <div>
            <p className="text-3xl font-bold text-[#12B76A]">$50B</p>
            <p className="text-sm text-gray-600">African remittance market</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#12B76A]">300+</p>
            <p className="text-sm text-gray-600">Supported wallets</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#12B76A]">&lt;1s</p>
            <p className="text-sm text-gray-600">Transaction time</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Built with ❤️ for Africa at ETH Accra 2024
          </p>
        </div>
      </div>
    </div>
  );
};
