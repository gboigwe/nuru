import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Address } from '../scaffold-eth/Address';
import { InputBase } from '../scaffold-eth/Input/InputBase';
import { Button } from '../scaffold-eth';
import { useXMTP } from '../../hooks/useXMTP';
import { PaymentNotificationService } from '../../services/messaging';
import { MessageTemplates } from '../../services/messaging/MessageTemplates';

interface XMTPChatProps {
  recipientAddress: string;
  autoOpen?: boolean;
  onClose?: () => void;
  initialMessage?: string;
  supportMode?: boolean;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'system';
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export const XMTPChat: React.FC<XMTPChatProps> = ({
  recipientAddress,
  autoOpen = false,
  onClose,
  initialMessage,
  supportMode = false
}) => {
  const { xmtpClient, isLoading, error, isInitialized, address } = useXMTP();
  const { address: userAddress } = useAccount();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const paymentNotificationService = PaymentNotificationService.getInstance();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat with initial message
  useEffect(() => {
    if (initialMessage && isOpen && xmtpClient) {
      addSystemMessage(initialMessage);
    }
  }, [initialMessage, isOpen, xmtpClient]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  const addSystemMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'system',
      content: message,
      timestamp: new Date(),
      type: 'system'
    }]);
  };

  const addSentMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: userAddress || 'me',
      content: message,
      timestamp: new Date(),
      type: 'sent',
      status: 'sent'
    }]);
  };

  const addReceivedMessage = (message: string, sender: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: sender,
      content: message,
      timestamp: new Date(),
      type: 'received',
      status: 'delivered'
    }]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !xmtpClient || !userAddress) return;

    const messageContent = newMessage.trim();
    setIsSending(true);

    try {
      addSentMessage(messageContent);

      // Send the message via XMTP
      const conversation = await xmtpClient.conversations.newConversation(recipientAddress);
      await conversation.send(messageContent);

      setNewMessage('');
      setIsSending(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg =>
        msg.content === messageContent && msg.type === 'sent'
          ? { ...msg, status: 'failed' }
          : msg
      ));
      setIsSending(false);
    }
  };

  const handleSendPaymentNotification = async (payment: any) => {
    if (!xmtpClient) return;

    try {
      await paymentNotificationService.sendPaymentNotification(recipientAddress, payment);
      addSystemMessage(`Payment notification sent: ${payment.amount} ${payment.currency}`);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      addSystemMessage('Failed to send payment notification');
    }
  };

  const handleSendSupportRequest = async (issue: string) => {
    if (!xmtpClient || !userAddress) return;

    try {
      await paymentNotificationService.sendSupportMessage(
        recipientAddress,
        userAddress,
        issue
      );
      addSystemMessage('Support request sent successfully');
    } catch (error) {
      console.error('Failed to send support request:', error);
      addSystemMessage('Failed to send support request');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center w-14 h-14"
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col h-[600px] max-h-[80vh]">
        {/* Chat Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold">
                {recipientAddress.slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{supportMode ? 'Support Chat' : 'Chat'}</h3>
              <p className="text-xs opacity-80">
                <Address address={recipientAddress} />
              </p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-white hover:text-gray-200"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-700">
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Initializing XMTP...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4">
              <p className="text-sm">⚠️ {error}</p>
              <p className="text-xs mt-1">XMTP client not available. Some features may be limited.</p>
            </div>
          )}

          {!isInitialized && !isLoading && !error && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Connect your wallet to enable XMTP messaging
              </p>
            </div>
          )}

          {messages.length === 0 && isInitialized && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {supportMode
                  ? 'Welcome to Nuru Support! How can we help you?'
                  : 'Start a conversation...'}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'received' && (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs">
                    {message.sender.slice(0, 2)}
                  </span>
                </div>
              )}

              <div
                className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                  message.type === 'sent'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : message.type === 'received'
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-bl-none'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center text-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="flex justify-end mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.type === 'sent' && message.status && (
                    <span className="ml-2 text-xs">
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                      {message.status === 'failed' && '❌'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isInitialized && (
          <div className="border-t dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <InputBase
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={supportMode ? "Describe your issue..." : "Type a message..."}
                disabled={isSending || !isInitialized}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim() || !isInitialized}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-2 flex space-x-1 overflow-x-auto">
              {supportMode ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(MessageTemplates.supportRequest('Payment issue'))}
                    className="text-xs px-2 py-1"
                  >
                    🆘 Payment Issue
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(MessageTemplates.supportRequest('Transaction stuck'))}
                    className="text-xs px-2 py-1"
                  >
                    ⏳ Stuck Transaction
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(MessageTemplates.supportRequest('Refund request'))}
                    className="text-xs px-2 py-1"
                  >
                    💰 Refund Request
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(MessageTemplates.paymentSent('10', 'USDC'))}
                    className="text-xs px-2 py-1"
                  >
                    🎉 Payment Sent
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(MessageTemplates.paymentReceived('10', 'USDC'))}
                    className="text-xs px-2 py-1"
                  >
                    ✅ Payment Received
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage('Thank you! 🙏')}
                    className="text-xs px-2 py-1"
                  >
                    🙏 Thank You
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Support Chat Component
interface SupportChatProps {
  recipient?: string;
  autoOpen?: boolean;
  hasIssue?: boolean;
}

export const SupportChat: React.FC<SupportChatProps> = ({
  recipient = 'support.nuru.eth',
  autoOpen = false,
  hasIssue = false
}) => {
  return (
    <XMTPChat
      recipientAddress={recipient}
      autoOpen={autoOpen || hasIssue}
      supportMode={true}
      initialMessage={hasIssue ? "Welcome to Nuru Support! How can we help you today?" : undefined}
    />
  );
};