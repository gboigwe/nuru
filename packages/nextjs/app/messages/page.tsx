"use client";

/**
 * Messages Page
 *
 * XMTP messaging interface
 */

import { useEffect, useState } from "react";
import type { Conversation } from "@xmtp/xmtp-js";
import { useAccount } from "wagmi";
import { ChatInterface } from "~~/components/xmtp/ChatInterface";
import { ConversationList } from "~~/components/xmtp/ConversationList";
import { xmtpClient } from "~~/services/xmtp";
import { useEthersSigner } from "~~/utils/scaffold-eth/useEthersSigner";

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
        console.log("✅ XMTP initialized for messages page");
      } catch (error) {
        console.error("Failed to initialize XMTP:", error);
        alert("Failed to initialize messaging. Please try again.");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeXMTP();
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
      alert("Failed to start conversation. Make sure the address is valid and on XMTP network.");
    }
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-base-content/60 mb-6">
            Connect your wallet to start messaging with XMTP
          </p>
        </div>
      </div>
    );
  }

  // Initializing
  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <span className="loading loading-spinner loading-lg mb-4"></span>
          <h2 className="text-2xl font-semibold mb-2">Initializing Messaging</h2>
          <p className="text-base-content/60">Setting up your XMTP client...</p>
        </div>
      </div>
    );
  }

  // Not initialized
  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Failed to Initialize</h2>
          <p className="text-base-content/60 mb-6">
            Could not initialize XMTP messaging. Please refresh and try again.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Conversations sidebar */}
          <div className="w-96 border border-base-300 rounded-lg overflow-hidden">
            <ConversationList
              onSelectConversation={setSelectedConversation}
              selectedConversation={selectedConversation || undefined}
            />

            {/* New conversation button */}
            <div className="p-4 border-t border-base-300">
              <button
                className="btn btn-primary w-full"
                onClick={() => setShowNewConversation(true)}
              >
                + New Message
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 border border-base-300 rounded-lg overflow-hidden">
            {selectedConversation ? (
              <ChatInterface conversation={selectedConversation} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-semibold mb-2">Select a Conversation</h2>
                <p className="text-base-content/60">Choose a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>

        {/* New conversation modal */}
        {showNewConversation && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Start New Conversation</h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Recipient Address</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input input-bordered w-full"
                  value={newConversationAddress}
                  onChange={(e) => setNewConversationAddress(e.target.value)}
                />
              </div>

              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowNewConversation(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStartNewConversation}
                  disabled={!newConversationAddress.trim()}
                >
                  Start Chat
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowNewConversation(false)} />
          </div>
        )}
      </div>
    );
  }

  // Mobile layout
  if (selectedConversation) {
    return (
      <div className="h-screen">
        <ChatInterface
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ConversationList
        onSelectConversation={setSelectedConversation}
        selectedConversation={selectedConversation || undefined}
      />

      {/* Floating new conversation button */}
      <button
        className="btn btn-primary btn-circle fixed bottom-4 right-4 w-16 h-16 shadow-lg"
        onClick={() => setShowNewConversation(true)}
      >
        <span className="text-2xl">+</span>
      </button>

      {/* New conversation modal */}
      {showNewConversation && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Start New Conversation</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Recipient Address</span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full"
                value={newConversationAddress}
                onChange={(e) => setNewConversationAddress(e.target.value)}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowNewConversation(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartNewConversation}
                disabled={!newConversationAddress.trim()}
              >
                Start Chat
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowNewConversation(false)} />
        </div>
      )}
    </div>
  );
}
