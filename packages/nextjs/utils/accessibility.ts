/**
 * Accessibility Utilities
 * Helper functions for WCAG 2.1 AA compliance
 */

export function formatNumberForScreenReader(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return value.toString();
  
  const [whole, decimal] = num.toFixed(2).split(".");
  const formattedWhole = parseInt(whole).toLocaleString("en-US");
  
  return decimal && decimal \!== "00"
    ? `${formattedWhole} point ${decimal}`
    : formattedWhole;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: high)").matches;
}

export function moveFocusTo(selector: string): void {
  if (typeof window === "undefined") return;
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    element.focus();
  }
}

export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
  );

  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key \!== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  element.addEventListener("keydown", handleKeyDown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}
