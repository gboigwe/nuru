"use client";

import { EmailLoginWelcomeFlow } from "./EmailLoginWelcomeFlow";
import { useOnboarding } from "~~/hooks/useOnboarding";

export const OnboardingWrapper = () => {
  const { shouldShowOnboarding, isCheckingSession, handleOnboardingComplete } = useOnboarding();

  if (isCheckingSession || !shouldShowOnboarding) {
    return null;
  }

  return <EmailLoginWelcomeFlow onComplete={handleOnboardingComplete} />;
};
