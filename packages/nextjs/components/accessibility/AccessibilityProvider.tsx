'use client';

import { ReactNode } from 'react';
import { ScreenReaderAnnouncer } from './ScreenReaderAnnouncer';
import { useKeyboardNavigation } from '~~/hooks/useKeyboardNavigation';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  useKeyboardNavigation();

  return (
    <>
      {children}
      <ScreenReaderAnnouncer />
    </>
  );
};
