"use client";

import Link from "next/link";
import { LanguageSwitcher } from "../i18n";

export const AccessibleNavigation = () => {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav role="navigation" aria-label="Main navigation" className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold text-blue-600"
              aria-label="Nuru Home"
            >
              Nuru
            </Link>

            <ul className="flex items-center gap-6">
              <li>
                <Link href="/" className="hover:text-blue-600">Home</Link>
              </li>
              <li>
                <Link href="/voice-pay" className="hover:text-blue-600">Voice Pay</Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-blue-600">Accessibility</Link>
              </li>
              <li>
                <LanguageSwitcher />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};
