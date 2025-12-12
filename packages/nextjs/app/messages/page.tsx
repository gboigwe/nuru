"use client";

/**
 * Messages Page
 *
 * XMTP messaging interface
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Conversation } from "@xmtp/xmtp-js";
import { useAccount } from "wagmi";
import { xmtpClient } from "~~/services/xmtp";
import { useEthersSigner } from "~~/utils/scaffold-eth/useEthersSigner";

// Dynamic imports for XMTP components to reduce initial bundle size
const ChatInterface = dynamic(() => import("~~/components/xmtp/ChatInterface").then(mod => ({ default: mod.ChatInterface })), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  ),
  ssr: false,
});

const ConversationList = dynamic(() => import("~~/components/xmtp/ConversationList").then(mod => ({ default: mod.ConversationList })), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="loading loading-spinner loading-md"></span>
    </div>
  ),
  ssr: false,
});

export default function MessagesPage() {
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newConversationAddress, setNewConversationAddress] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize XMTP
  useEffect(() => {
    const initializeXMTP = async () => {
      if (!signer || isInitialized || isInitializing) {
        return;
      }

      setIsInitializing(true);

      try {
        await xmtpClient.initialize(signer);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize XMTP:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    if (signer && !isInitialized) {
      initializeXMTP();
    }
  }, [signer, isInitialized, isInitializing]);

  const handleStartNewConversation = async () => {
    if (!newConversationAddress.trim()) {
      return;
    }

    try {
      const conversation = await xmtpClient.startConversation(newConversationAddress);
      setSelectedConversation(conversation);
      setNewConversationAddress("");
      setShowNewConversation(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Messages</h1>
          <p className="text-base-content/70">Please connect your wallet to access messages</p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg mb-4"></span>
            <p className="text-base-content/70">Initializing XMTP...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Messages</h1>
          <p className="text-base-content/70 mb-4">Failed to initialize XMTP client</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-base-content/60 text-sm">Secure wallet-to-wallet messaging</p>
        </div>

        {/* New Conversation Button */}
        <button className="btn btn-primary btn-sm" onClick={() => setShowNewConversation(!showNewConversation)}>
          ✉️ New Message
        </button>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="card bg-base-100 shadow-xl mb-4 p-4">
          <h2 className="text-xl font-bold mb-3">Start New Conversation</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              className="input input-bordered flex-1"
              value={newConversationAddress}
              onChange={e => setNewConversationAddress(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleStartNewConversation()}
            />
            <button className="btn btn-primary" onClick={handleStartNewConversation}>
              Start
            </button>
            <button className="btn btn-ghost" onClick={() => setShowNewConversation(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversation List */}
        {(!isMobile || !selectedConversation) && (
          <div className="md:col-span-1">
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
            />
          </div>
        )}

        {/* Chat Interface */}
        {(!isMobile || selectedConversation) && (
          <div className="md:col-span-2">
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                onBack={isMobile ? () => setSelectedConversation(null) : undefined}
              />
            ) : (
              <div className="card bg-base-100 shadow-xl h-full flex items-center justify-center">
                <div className="text-center text-base-content/50">
                  <p className="text-xl mb-2">💬</p>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
