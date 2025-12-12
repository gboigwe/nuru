/**
 * NLP Types and Interfaces for Advanced Voice Command Processing
 *
 * Supports multi-language, context-aware voice command parsing
 */

// Supported languages for voice commands
export type SupportedLanguage =
  | "en" // English
  | "tw" // Twi
  | "ha" // Hausa
  | "yo" // Yoruba
  | "ig" // Igbo
  | "ga" // Ga
  | "pcm" // Nigerian Pidgin
  | "fr" // French
  | "sw"; // Swahili

// Payment action intents
export type PaymentIntent =
  | "send_money"
  | "check_balance"
  | "split_payment"
  | "recurring_payment"
  | "cancel_recurring"
  | "view_history"
  | "request_money"
  | "unknown";

// Entity types extracted from commands
export interface ExtractedEntities {
  amount?: string;
  recipient?: string;
  currency?: string;
  frequency?: "daily" | "weekly" | "monthly";
  splits?: Array<{
    recipient: string;
    amount?: string;
    percentage?: number;
  }>;
  reference?: string;
  context?: "last_recipient" | "saved_contact" | "new_address";
}

// Detected language with confidence
export interface LanguageDetection {
  language: SupportedLanguage;
  confidence: number;
  isCodeSwitched: boolean;
  detectedLanguages?: SupportedLanguage[];
}

// Processed voice command result
export interface ProcessedCommand {
  intent: PaymentIntent;
  entities: ExtractedEntities;
  language: LanguageDetection;
  confidence: number;
  originalText: string;
  normalizedText: string;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  suggestions?: string[];
}

// User context for conversation tracking
export interface UserContext {
  userId: string;
  recentRecipients: Array<{
    address: string;
    name?: string;
    lastUsed: Date;
  }>;
  recentAmounts: Array<{
    amount: string;
    currency: string;
    timestamp: Date;
  }>;
  preferredCurrency?: string;
  preferredLanguage?: SupportedLanguage;
  conversationHistory: ConversationTurn[];
}

// Single conversation turn
export interface ConversationTurn {
  timestamp: Date;
  userInput: string;
  processedCommand: ProcessedCommand;
  successful: boolean;
}

// OpenAI service configuration
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Language-specific terms for actions and currencies
export interface LanguageTerms {
  sendMoney: string[];
  checkBalance: string[];
  splitPayment: string[];
  currencies: Record<string, string[]>;
}

// NLP processing options
export interface NLPProcessingOptions {
  useContext?: boolean;
  maxContextTurns?: number;
  enableSuggestions?: boolean;
  strictMode?: boolean;
}

// Error types for NLP processing
export enum NLPErrorType {
  AMBIGUOUS_COMMAND = "ambiguous_command",
  MISSING_ENTITY = "missing_entity",
  INVALID_AMOUNT = "invalid_amount",
  INVALID_ADDRESS = "invalid_address",
  UNSUPPORTED_LANGUAGE = "unsupported_language",
  API_ERROR = "api_error",
  CONTEXT_ERROR = "context_error",
}

export interface NLPError {
  type: NLPErrorType;
  message: string;
  suggestion?: string;
  clarificationNeeded?: boolean;
}

// Intent extraction response from OpenAI
export interface IntentExtractionResponse {
  intent: PaymentIntent;
  entities: ExtractedEntities;
  confidence: number;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  reasoning?: string;
}
