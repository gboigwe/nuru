import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import "~~/styles/accessibility.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { useTranslation } from 'react-i18next';
import { isRTL } from '~/i18n/config';

export const metadata = getMetadata({
  title: "Nuru - Light up your payments",
  description: "Voice-powered crypto remittances for Africa. Built with ✨ at ETH Accra 2024",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const dir = isRTL(i18n.language) ? 'rtl' : 'ltr';

  return (
    <html lang={i18n.language} dir={dir} suppressHydrationWarning>
      <body className={`${dir === 'rtl' ? 'font-arabic' : 'font-sans'}`}>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
