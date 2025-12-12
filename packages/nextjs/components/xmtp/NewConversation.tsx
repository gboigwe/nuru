"use client";

/**
 * New Conversation Component
 *
 * Modal for starting a new XMTP conversation
 */

import { useState } from "react";
import { isAddress } from "viem";
import { xmtpClient } from "~~/services/xmtp";
import type { Conversation } from "@xmtp/xmtp-js";

interface NewConversationProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const NewConversation = ({ isOpen, onClose, onConversationCreated }: NewConversationProps) => {
  const [address, setAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    // Validate address
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    if (!isAddress(address)) {
      setError("Invalid Ethereum address");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check if address is on XMTP network
      const canMessage = await xmtpClient.canMessage(address);

      if (!canMessage) {
        setError("This address is not on the XMTP network. They need to sign up for XMTP first.");
        setIsCreating(false);
        return;
      }

      // Create conversation
      const conversation = await xmtpClient.startConversation(address);

      // Reset form
      setAddress("");
      setError(null);

      // Notify parent
      onConversationCreated(conversation);

      // Close modal
      onClose();
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setAddress("");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Start New Conversation</h3>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Recipient Address</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            className={`input input-bordered w-full ${error ? "input-error" : ""}`}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError(null);
            }}
            disabled={isCreating}
            autoFocus
          />
          {error && (
            <label className="label">
              <span className="label-text-alt text-error">{error}</span>
            </label>
          )}
          <label className="label">
            <span className="label-text-alt">
              Enter the Ethereum address of the person you want to message
            </span>
          </label>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!address.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Creating...
              </>
            ) : (
              "Start Chat"
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
};
