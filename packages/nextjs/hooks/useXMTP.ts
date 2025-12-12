import { useEffect, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { XMTPService } from '../services/messaging/XMTPService';
import { Client } from '@xmtp/xmtp-js';

export const useXMTP = () => {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const initializeXMTP = async () => {
      if (!isConnected || !signer || !address) {
        if (isMounted) {
          setIsInitialized(false);
          setXmtpClient(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const xmtpService = XMTPService.getInstance();

        // Check if already initialized
        const existingClient = xmtpService.getClient();
        if (existingClient) {
          if (isMounted) {
            setXmtpClient(existingClient);
            setIsInitialized(true);
            setIsLoading(false);
          }
          return;
        }

        // Initialize new client
        const client = await xmtpService.initialize(signer);
        if (isMounted) {
          setXmtpClient(client);
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('XMTP initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
          setIsLoading(false);
          setIsInitialized(false);
        }
      }
    };

    initializeXMTP();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected, signer]);

  const disconnectXMTP = async () => {
    try {
      const xmtpService = XMTPService.getInstance();
      await xmtpService.disconnect();
      if (xmtpClient) {
        setXmtpClient(null);
        setIsInitialized(false);
      }
    } catch (err) {
      console.error('XMTP disconnection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect XMTP');
    }
  };

  const canMessage = async (recipientAddress: string): Promise<boolean> => {
    if (!xmtpClient) {
      return false;
    }

    try {
      return await xmtpClient.canMessage(recipientAddress);
    } catch (err) {
      console.error('Error checking message capability:', err);
      return false;
    }
  };

  return {
    xmtpClient,
    isLoading,
    error,
    isInitialized,
    isConnected,
    address,
    disconnectXMTP,
    canMessage
  };
};
