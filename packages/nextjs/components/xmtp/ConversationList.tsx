"use client";

/**
 * XMTP Conversation List Component
 *
 * Displays list of conversations
 */

import { useEffect, useState } from "react";
import type { Conversation } from "@xmtp/xmtp-js";
import { xmtpClient } from "~~/services/xmtp";

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversation?: Conversation;
}

interface ConversationPreview {
  conversation: Conversation;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export const ConversationList = ({
  onSelectConversation,
  selectedConversation,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const convs = await xmtpClient.getConversations();

        // Load previews for each conversation
        const previews = await Promise.all(
          convs.map(async (conv) => {
            try {
              const messages = await xmtpClient.getMessages(conv);
              const lastMsg = messages[messages.length - 1];

              return {
                conversation: conv,
                lastMessage: lastMsg?.content || undefined,
                lastMessageTime: lastMsg?.sent || undefined,
                unreadCount: 0, // TODO: Implement read receipts
              };
            } catch (error) {
              console.error("Failed to load conversation preview:", error);
              return {
                conversation: conv,
                unreadCount: 0,
              };
            }
          })
        );

        // Sort by last message time
        previews.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        });

        setConversations(previews);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();

    // Stream new conversations
    let cleanup: (() => void) | undefined;

    const startStreaming = async () => {
      cleanup = await xmtpClient.streamConversations((conv) => {
        setConversations(prev => [
          {
            conversation: conv,
            unreadCount: 0,
          },
          ...prev,
        ]);
      });
    };

    startStreaming();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.conversation.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <h2 className="text-2xl font-bold mb-4">Messages</h2>

        {/* Search */}
        <div className="form-control">
          <input
            type="text"
            placeholder="Search conversations..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </h3>
            <p className="text-base-content/60">
              {searchQuery
                ? "Try searching for a different address"
                : "Start a conversation to see it here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {filteredConversations.map((preview) => {
              const isSelected =
                preview.conversation.peerAddress === selectedConversation?.peerAddress;

              return (
                <button
                  key={preview.conversation.topic}
                  className={`w-full p-4 hover:bg-base-200 transition-colors text-left ${
                    isSelected ? "bg-base-200" : ""
                  }`}
                  onClick={() => onSelectConversation(preview.conversation)}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-12">
                        <span>{formatAddress(preview.conversation.peerAddress)[0]}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {formatAddress(preview.conversation.peerAddress)}
                        </h3>
                        {preview.lastMessageTime && (
                          <span className="text-xs text-base-content/60">
                            {formatTime(preview.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-base-content/60 truncate">
                          {preview.lastMessage || "No messages yet"}
                        </p>
                        {preview.unreadCount > 0 && (
                          <span className="badge badge-primary badge-sm">
                            {preview.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
