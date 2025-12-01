import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { hardhat } from "viem/chains";

/**
 * This hook handles auto-connection to the last used wallet if available.
 * It's used to maintain wallet connection state across page refreshes.
 */
export const useAutoConnect = (): void => {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

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
      connect({ connector, chainId: hardhat.id });
    }
  }, [connect, connectors, isConnected]);
};

export default useAutoConnect;
