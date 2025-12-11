"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { sessionManager } from "~~/services/session/SessionManager";
import { WelcomeScreen } from "./WelcomeScreen";
import { ProfileSetup } from "./ProfileSetup";
import { WalletBackupOptions } from "./WalletBackupOptions";
import { FirstPaymentTutorial } from "./FirstPaymentTutorial";

interface EmailLoginWelcomeFlowProps {
  onComplete: () => void;
}

type OnboardingStep = "welcome" | "profile" | "backup" | "tutorial";

export const EmailLoginWelcomeFlow = ({ onComplete }: EmailLoginWelcomeFlowProps) => {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [progress, setProgress] = useState(0);

  const steps: OnboardingStep[] = ["welcome", "profile", "backup", "tutorial"];

  useEffect(() => {
    const session = sessionManager.getSession();
    if (session?.onboardingStep) {
      const stepIndex = Math.min(session.onboardingStep, steps.length - 1);
      setCurrentStep(steps[stepIndex]);
      setProgress((stepIndex / steps.length) * 100);
    }
  }, []);

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      setCurrentStep(nextStep);
      setProgress(((nextIndex + 1) / steps.length) * 100);

      sessionManager.updateSession({
        onboardingStep: nextIndex,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    sessionManager.updateSession({
      onboardingCompleted: true,
      onboardingStep: steps.length,
    });
    onComplete();
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeScreen onNext={handleNext} />;
      case "profile":
        return <ProfileSetup onNext={handleNext} onSkip={handleSkip} />;
      case "backup":
        return <WalletBackupOptions onNext={handleNext} onSkip={handleSkip} />;
      case "tutorial":
        return <FirstPaymentTutorial onNext={handleComplete} onSkip={handleSkip} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-t-2xl">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-t-2xl"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-8">{getStepComponent()}</div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pb-6">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all ${
                steps.indexOf(currentStep) >= index ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
