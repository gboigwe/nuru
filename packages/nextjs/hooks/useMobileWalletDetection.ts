import { useEffect, useState } from 'react';

type WalletInfo = {
  installed: boolean;
  deepLink?: string;
  storeLink?: string;
};

type WalletDetection = {
  isMobile: boolean;
  installedWallets: {
    metamask: WalletInfo;
    trust: WalletInfo;
    coinbase: WalletInfo;
    rainbow: WalletInfo;
  };
  getDeepLink: (walletId: keyof ReturnType<typeof useMobileWalletDetection>['installedWallets']) => string | undefined;
};

// Detect if a specific wallet is installed
export function useMobileWalletDetection(): WalletDetection {
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Check if we're on mobile
  useEffect(() => {
    const mobileCheck = () => {
      const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(mobile);
      setIsReady(true);
    };
    
    if (typeof window !== 'undefined') {
      mobileCheck();
      window.addEventListener('resize', mobileCheck);
      return () => window.removeEventListener('resize', mobileCheck);
    }
    
    return () => {};
  }, []);

  // Detect installed wallets
  const detectWallets = () => {
    if (typeof window === 'undefined') {
      return {
        metamask: { installed: false },
        trust: { installed: false },
        coinbase: { installed: false },
        rainbow: { installed: false },
      };
    }

    const ethereum = (window as any).ethereum;
    const isMetaMask = ethereum?.isMetaMask;
    const isTrust = ethereum?.isTrust;
    const isCoinbaseWallet = ethereum?.isCoinbaseWallet;
    const isRainbow = ethereum?.isRainbow;

    return {
      metamask: {
        installed: !!isMetaMask,
        deepLink: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`,
        storeLink: isMobile 
          ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'https://apps.apple.com/app/metamask/id1438144202'
            : 'https://play.google.com/store/apps/details?id=io.metamask'
          : 'https://metamask.io/download/'
      },
      trust: {
        installed: !!isTrust,
        deepLink: `https://link.trustwallet.com/open_url?url=${encodeURIComponent(window.location.href)}`,
        storeLink: isMobile
          ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
            : 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
          : 'https://trustwallet.com/'
      },
      coinbase: {
        installed: !!isCoinbaseWallet,
        deepLink: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`,
        storeLink: isMobile
          ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'https://apps.apple.com/app/coinbase-wallet-nfts-crypto/id1278383455'
            : 'https://play.google.com/store/apps/details?id=org.toshi'
          : 'https://www.coinbase.com/wallet/'
      },
      rainbow: {
        installed: !!isRainbow,
        deepLink: `https://rnbwapp.com/wc?uri=${encodeURIComponent(`wc:${window.location.href.replace(/^https?:\/\//, '')}`)}`,
        storeLink: isMobile
          ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021'
            : 'https://play.google.com/store/apps/details?id=me.rainbow'
          : 'https://rainbow.me/'
      },
    };
  };

  const installedWallets = detectWallets();

  const getDeepLink = (walletId: keyof ReturnType<typeof detectWallets>): string | undefined => {
    return installedWallets[walletId]?.deepLink;
  };

  return {
    isMobile,
    installedWallets,
    getDeepLink
  };
}

// Utility function to detect if the current device is iOS
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Utility function to detect if the current device is Android
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

// Utility function to open a deep link with fallback
export function openDeepLink(url: string, fallbackUrl?: string): void {
  if (typeof window === 'undefined') return;
  
  const timeout = setTimeout(() => {
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
    }
  }, 500);

  window.location.href = url;
  
  window.addEventListener('pagehide', () => clearTimeout(timeout), { once: true });
}
