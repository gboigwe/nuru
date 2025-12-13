/**

 * Accessibility Type Definitions
 */

export interface A11yPreferences {
  fontSize: number;
  reducedMotion: boolean;
  highContrast: boolean;
  language: string;
  textDirection: "ltr" | "rtl";
}

export interface WCAGTestResult {
  pass: boolean;
  violations: string[];
}

export interface AccessibilityAudit {
  passed: number;
  failed: number;
  tests: Record<string, WCAGTestResult>;
  timestamp: Date;
}

export type AriaLive = "polite" | "assertive" | "off";

export type AriaRole =
  | "alert"
  | "button"
  | "checkbox"
  | "dialog"
  | "link"
  | "main"
  | "navigation"
  | "region"
  | "status"
  | "tab"
  | "tabpanel";

export interface ARIAAttributes {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-live"?: AriaLive;
  "aria-atomic"?: boolean;
  "aria-busy"?: boolean;
  "aria-disabled"?: boolean;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean;
  "aria-hidden"?: boolean;
  "aria-invalid"?: boolean;
  "aria-pressed"?: boolean;
  "aria-required"?: boolean;
  "aria-selected"?: boolean;
  role?: AriaRole;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: () => void;
}
