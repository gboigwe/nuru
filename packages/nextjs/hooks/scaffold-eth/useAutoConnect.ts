import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useTargetNetwork } from "./useTargetNetwork";

/**
 * This hook handles auto-connection to the last used wallet if available.
 * It's used to maintain wallet connection state across page refreshes.
 * Now uses the target network from scaffold.config.ts instead of hardcoded hardhat.
 */
export const useAutoConnect = (): void => {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  useEffect(() => {
    // Skip if already connected or in a non-browser environment
    if (isConnected || typeof window === "undefined") {
      return;
    }

    // Try to auto-connect to the last used connector
    const lastUsedConnector = window.localStorage.getItem("scaffoldEth2.lastUsedConnector");
    if (!lastUsedConnector) {
      return;
    }

    const connector = connectors.find((c) => c.id === lastUsedConnector);
    if (connector) {
      // Use target network from config instead of hardcoded hardhat
      connect({ connector, chainId: targetNetwork.id });
    }
  }, [connect, connectors, isConnected, targetNetwork]);
};

export default useAutoConnect;
