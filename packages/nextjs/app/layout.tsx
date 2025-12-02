"use client";

import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { EmailLoginWelcomeFlow } from "~~/components/onboarding";
import { useOnboarding } from "~~/hooks/useOnboarding";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

// This is a workaround for the 'use client' directive with metadata
export const metadata = getMetadata({
  title: "Nuru - Light up your payments",
  description: "Voice-powered crypto remittances for Africa. Built with ✨ at ETH Accra 2024",
  themeColor: "#12B76A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const { shouldShowOnboarding, isCheckingSession, handleOnboardingComplete } = useOnboarding();

  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            {children}
            {!isCheckingSession && shouldShowOnboarding && (
              <EmailLoginWelcomeFlow onComplete={handleOnboardingComplete} />
            )}
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
