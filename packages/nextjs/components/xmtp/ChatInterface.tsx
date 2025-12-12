"use client";

/**
 * XMTP Chat Interface Component
 *
 * Displays conversation messages and input
 */

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@xmtp/xmtp-js";
import { xmtpClient, type XMTPMessage } from "~~/services/xmtp";

interface ChatInterfaceProps {
  conversation: Conversation;
  onClose?: () => void;
}

export const ChatInterface = ({ conversation, onClose }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<XMTPMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAddress = xmtpClient.getAddress();

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const msgs = await xmtpClient.getMessages(conversation);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Stream new messages
    let cleanup: (() => void) | undefined;

    const startStreaming = async () => {
      cleanup = await xmtpClient.streamMessages(conversation, (msg) => {
        setMessages(prev => [...prev, msg]);
      });
    };

    startStreaming();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [conversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await conversation.send(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-10">
              <span className="text-sm">{formatAddress(conversation.peerAddress)[0]}</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{formatAddress(conversation.peerAddress)}</h3>
            <p className="text-xs text-base-content/60">XMTP Conversation</p>
          </div>
        </div>

        {onClose && (
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-base-content/60">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderAddress.toLowerCase() === currentAddress?.toLowerCase();
            const showDate =
              index === 0 ||
              new Date(messages[index - 1].sent).toDateString() !== new Date(msg.sent).toDateString();

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-base-200 px-3 py-1 rounded-full text-xs text-base-content/60">
                      {new Date(msg.sent).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? "bg-primary text-primary-content rounded-br-sm"
                          : "bg-base-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className="text-xs text-base-content/50 mt-1 px-2">
                      {formatTime(new Date(msg.sent))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
