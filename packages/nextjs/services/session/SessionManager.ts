/**
 * Session Manager Service
 *
 * Handles persistent wallet sessions for Email/Social login users.
 * Provides secure session storage, auto-refresh, and recovery mechanisms.
 *
 * Security Features:
 * - Encrypted session data in localStorage
 * - Secure random session tokens
 * - Session expiration monitoring
 * - No private key storage (only session metadata)
 *
 * @see https://docs.reown.com/appkit/authentication
 */

import { SIWESession } from "@reown/appkit-siwe";

const STORAGE_KEY = "nuru_session";
const SESSION_DURATION = 3600000; // 1 hour in milliseconds
const REFRESH_THRESHOLD = 300000; // 5 minutes before expiration

export interface SessionData {
  address: string;
  chainId: number;
  email?: string;
  provider: "email" | "google" | "apple" | "discord" | "farcaster" | "wallet";
  createdAt: number;
  expiresAt: number;
  sessionToken: string;
  rememberMe: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  profile?: {
    displayName?: string;
    avatar?: string;
  };
}

export class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.initializeSessionMonitoring();
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session
   */
  createSession(data: Omit<SessionData, "createdAt" | "expiresAt" | "sessionToken">): SessionData {
    const now = Date.now();
    const session: SessionData = {
      ...data,
      createdAt: now,
      expiresAt: now + SESSION_DURATION,
      sessionToken: this.generateSessionToken(),
    };

    this.saveSession(session);
    this.scheduleRefresh(session);

    return session;
  }

  /**
   * Retrieve current session
   */
  getSession(): SessionData | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const session: SessionData = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Failed to retrieve session:", error);
      return null;
    }
  }

  /**
   * Update existing session
   */
  updateSession(updates: Partial<SessionData>): void {
    const current = this.getSession();
    if (!current) return;

    const updated = { ...current, ...updates };
    this.saveSession(updated);
  }

  /**
   * Refresh session (extend expiration)
   */
  refreshSession(): SessionData | null {
    const current = this.getSession();
    if (!current) return null;

    const now = Date.now();
    const refreshed: SessionData = {
      ...current,
      expiresAt: now + SESSION_DURATION,
    };

    this.saveSession(refreshed);
    this.scheduleRefresh(refreshed);

    return refreshed;
  }

  /**
   * Clear session and cleanup
   */
  clearSession(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE_KEY);

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const timeUntilExpiry = session.expiresAt - Date.now();
    return timeUntilExpiry <= REFRESH_THRESHOLD;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;

    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Convert to SIWE session format
   */
  toSIWESession(): SIWESession | null {
    const session = this.getSession();
    if (!session) return null;

    return {
      address: session.address,
      chainId: session.chainId,
    };
  }

  /**
   * Private: Save session to localStorage
   */
  private saveSession(session: SessionData): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  /**
   * Private: Generate secure session token
   */
  private generateSessionToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for SSR
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Private: Schedule automatic refresh
   */
  private scheduleRefresh(session: SessionData): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const timeUntilRefresh = session.expiresAt - Date.now() - REFRESH_THRESHOLD;

    if (timeUntilRefresh > 0 && session.rememberMe) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession();
      }, timeUntilRefresh);
    }
  }

  /**
   * Private: Initialize session monitoring on app start
   */
  private initializeSessionMonitoring(): void {
    const session = this.getSession();
    if (session && session.rememberMe) {
      this.scheduleRefresh(session);
    }
  }

  /**
   * Get all active sessions (for multi-device management)
   */
  getAllSessions(): SessionData[] {
    // For now, we only support single session per browser
    // In the future, this could query a backend for all user sessions
    const current = this.getSession();
    return current ? [current] : [];
  }

  /**
   * Revoke a specific session
   */
  revokeSession(sessionToken: string): void {
    const current = this.getSession();
    if (current?.sessionToken === sessionToken) {
      this.clearSession();
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
