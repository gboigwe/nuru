"use client";

import { FontSizeControl } from "~~/components/settings/FontSizeControl";
import { LanguageSwitcher } from "~~/components/i18n";
import { useTranslation } from "react-i18next";

export default function AccessibilitySettings() {
  const { t } = useTranslation();

  return (
    <main className="container mx-auto px-4 py-8">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <div id="main-content">
        <h1 className="text-3xl font-bold mb-6">
          Accessibility Settings
        </h1>

        <div className="space-y-8">
          {/* Language Selection */}
          <section aria-labelledby="language-heading">
            <h2 id="language-heading" className="text-2xl font-semibold mb-4">
              Language
            </h2>
            <LanguageSwitcher />
          </section>

          {/* Font Size */}
          <section aria-labelledby="font-heading">
            <h2 id="font-heading" className="text-2xl font-semibold mb-4">
              Font Size
            </h2>
            <FontSizeControl />
          </section>

          {/* Accessibility Info */}
          <section aria-labelledby="info-heading" className="bg-blue-50 p-6 rounded-lg">
            <h2 id="info-heading" className="text-2xl font-semibold mb-4">
              Accessibility Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Screen reader support (NVDA, JAWS, VoiceOver)</li>
              <li>Full keyboard navigation</li>
              <li>High contrast mode support</li>
              <li>Reduced motion support</li>
              <li>9 language support with RTL for Arabic</li>
              <li>WCAG 2.1 AA compliant</li>
            </ul>
          </section>

          {/* Keyboard Shortcuts */}
          <section aria-labelledby="shortcuts-heading">
            <h2 id="shortcuts-heading" className="text-2xl font-semibold mb-4">
              Keyboard Shortcuts
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-semibold">Escape</dt>
                <dd className="text-gray-600">Close modals and dialogs</dd>
              </div>
              <div>
                <dt className="font-semibold">Tab</dt>
                <dd className="text-gray-600">Navigate between interactive elements</dd>
              </div>
              <div>
                <dt className="font-semibold">Enter</dt>
                <dd className="text-gray-600">Activate buttons and links</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
