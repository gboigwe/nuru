/**

 * Accessibility Testing Utilities
 * Helper functions for validating WCAG 2.1 AA compliance
 */

/**
 * Check if all images have alt text
 */
export function checkImagesHaveAltText(): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const images = document.querySelectorAll("img");

  images.forEach((img, index) => {
    const alt = img.getAttribute("alt");
    if (alt === null || alt.trim() === "") {
      violations.push(`Image #${index + 1} missing alt text: ${img.src}`);
    }
  });

  return { pass: violations.length === 0, violations };
}

/**
 * Check if all interactive elements have accessible names
 */
export function checkInteractiveElementsHaveNames(): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const interactive = document.querySelectorAll("button, a, input, select, textarea");

  interactive.forEach((el, index) => {
    const hasAriaLabel = el.hasAttribute("aria-label");
    const hasAriaLabelledBy = el.hasAttribute("aria-labelledby");
    const hasTitle = el.hasAttribute("title");
    const hasVisibleText = el.textContent?.trim() !== "";

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasVisibleText) {
      violations.push(`Element #${index + 1} missing accessible name: ${el.tagName}`);
    }
  });

  return { pass: violations.length === 0, violations };
}

/**
 * Check heading hierarchy
 */
export function checkHeadingHierarchy(): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

  let lastLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));

    if (level - lastLevel > 1) {
      violations.push(`Heading #${index + 1} skips level (${heading.tagName} after h${lastLevel})`);
    }

    lastLevel = level;
  });

  return { pass: violations.length === 0, violations };
}

/**
 * Check if lang attribute is set
 */
export function checkLanguageAttribute(): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const html = document.documentElement;

  if (!html.hasAttribute("lang")) {
    violations.push("HTML element missing lang attribute");
  }

  return { pass: violations.length === 0, violations };
}

/**
 * Run all accessibility tests
 */
export function runAccessibilityTests(): {
  passed: number;
  failed: number;
  tests: Record<string, { pass: boolean; violations: string[] }>;
} {
  const tests = {
    "Images have alt text": checkImagesHaveAltText(),
    "Interactive elements have names": checkInteractiveElementsHaveNames(),
    "Heading hierarchy": checkHeadingHierarchy(),
    "Language attribute": checkLanguageAttribute(),
  };

  const passed = Object.values(tests).filter((t) => t.pass).length;
  const failed = Object.values(tests).filter((t) => !t.pass).length;

  return { passed, failed, tests };
}
