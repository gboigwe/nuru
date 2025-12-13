import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { WebVitals } from "~~/components/WebVitals";
import { OnboardingWrapper } from "~~/components/onboarding/OnboardingWrapper";
import { PWAProvider } from "~~/components/pwa/PWAProvider";
import { AccessibilityProvider } from "~~/components/accessibility";
import { I18nProvider } from "~~/components/i18n";
import "~~/styles/globals.css";
import { getMetadata, getViewport } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Nuru - Light up your payments",
  description: "Voice-powered crypto remittances for Africa. Built with ✨ at ETH Accra 2024",
});

export const viewport = getViewport();

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <I18nProvider>
            <AccessibilityProvider>
              <ScaffoldEthAppWithProviders>
                <WebVitals />
                {children}
                <OnboardingWrapper />
                <PWAProvider />
              </ScaffoldEthAppWithProviders>
            </AccessibilityProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
