/**
 * Type definitions for Reown AppKit React integration
 *
 * Provides comprehensive TypeScript types for AppKit hooks, components, and utilities.
 * Ensures type safety and IDE autocomplete for all AppKit features.
 *
 * @see https://docs.reown.com/appkit/react/hooks
 */

import 'react';

/**
 * Available views in AppKit modal
 */
export type AppKitView =
  | 'Account'
  | 'Connect'
  | 'Networks'
  | 'ApproveTransaction'
  | 'OnRampProviders'
  | 'Transactions'
  | 'ConnectingExternal'
  | 'ConnectingWalletConnect'
  | 'EmailWallet'
  | 'SocialWallet';

/**
 * Options for opening AppKit modal
 */
export interface OpenOptions {
  /**
   * Specific view to open
   * @example open({ view: 'OnRampProviders' })
   */
  view?: AppKitView;
}

/**
 * Return type for useAppKit hook
 */
export interface UseAppKitReturn {
  /**
   * Opens the AppKit modal
   * @param options - Optional configuration for which view to open
   * @example
   * // Open default connect view
   * open()
   *
   * // Open specific view
   * open({ view: 'OnRampProviders' })
   */
  open: (options?: OpenOptions) => void;

  /**
   * Closes the AppKit modal
   */
  close: () => void;
}

/**
 * Web component declarations for Reown AppKit
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * AppKit connect/account button component
       * @example <appkit-button className="custom-class" />
       */
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        className?: string;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        label?: string;
        balance?: 'show' | 'hide';
      };

      /**
       * AppKit network switcher button component
       * @example <appkit-network-button className="custom-class" />
       */
      'appkit-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        className?: string;
        disabled?: boolean;
      };

      /**
       * AppKit account button component
       * @example <appkit-account-button className="custom-class" />
       */
      'appkit-account-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        className?: string;
        disabled?: boolean;
      };

      /**
       * Legacy WalletConnect button (v2 compatibility)
       */
      'w3m-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        className?: string;
      };

      /**
       * Legacy WalletConnect modal (v2 compatibility)
       */
      'w3m-modal': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        className?: string;
      };
    }
  }
}

/**
 * Module declaration for @reown/appkit/react
 */
declare module '@reown/appkit/react' {
  /**
   * Hook to interact with AppKit modal
   * @returns Methods to open and close the modal
   * @example
   * const { open, close } = useAppKit();
   * open({ view: 'OnRampProviders' });
   */
  export function useAppKit(): UseAppKitReturn;

  /**
   * Hook to get AppKit state
   */
  export function useAppKitState(): {
    open: boolean;
    selectedNetworkId: number | undefined;
  };

  /**
   * Hook to get AppKit events
   */
  export function useAppKitEvents(): void;

  /**
   * Hook to disconnect wallet
   */
  export function useDisconnect(): {
    disconnect: () => Promise<void>;
  };
}

export {};
