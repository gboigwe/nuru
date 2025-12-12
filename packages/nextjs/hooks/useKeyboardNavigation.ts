import { useEffect } from 'react';

export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }
      }

      // Enter to activate buttons
      if (e.key === 'Enter' && document.activeElement?.tagName === 'BUTTON') {
        (document.activeElement as HTMLElement).click();
      }

      // Ctrl+/ for keyboard shortcuts help
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        // Show keyboard shortcuts modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};