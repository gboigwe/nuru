import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { sessionManager } from "~~/services/session/SessionManager";

/**
 * Hook to manage onboarding flow for email/social login users
 * Returns whether to show onboarding and handler to complete it
 */
export function useOnboarding() {
  const { address, isConnected } = useAccount();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setShouldShowOnboarding(false);
      setIsCheckingSession(false);
      return;
    }

    const checkOnboardingStatus = () => {
      const session = sessionManager.getSession();

      // Only show onboarding for email/social login users
      const isEmailSocialUser =
        session?.provider && ["email", "google", "apple", "discord", "farcaster"].includes(session.provider);

      // Check if onboarding is already completed
      const hasCompletedOnboarding = session?.onboardingCompleted === true;

      setShouldShowOnboarding(isEmailSocialUser && !hasCompletedOnboarding);
      setIsCheckingSession(false);
    };

    checkOnboardingStatus();
  }, [address, isConnected]);

  const handleOnboardingComplete = () => {
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    isCheckingSession,
    handleOnboardingComplete,
  };
}
