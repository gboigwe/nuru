import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { OnboardingWrapper } from "~~/components/onboarding/OnboardingWrapper";
import { PWAProvider } from "~~/components/pwa/PWAProvider";
import "~~/styles/globals.css";
import { getMetadata, getViewport } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Nuru - Light up your payments",
  description: "Voice-powered crypto remittances for Africa. Built with ✨ at ETH Accra 2024",
});

export const viewport = getViewport();

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {

  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            {children}
            <OnboardingWrapper />
            <PWAProvider />
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
