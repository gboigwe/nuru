/**
 * Enhanced Voice Command Processor
 *
 * Main processor integrating OpenAI, language detection, and context management
 * for advanced NLP-powered voice command parsing
 */

import { openAIService } from "./OpenAIService";
import { languageDetector } from "./LanguageDetector";
import { contextManager } from "./ContextManager";
import type { ProcessedCommand, NLPProcessingOptions, NLPError, NLPErrorType } from "~~/types/nlp";

class EnhancedVoiceCommandProcessorService {
  /**
   * Process voice command with advanced NLP
   */
  async processCommand(
    voiceText: string,
    userId: string,
    options: NLPProcessingOptions = {},
  ): Promise<ProcessedCommand> {
    const { useContext = true, enableSuggestions = true } = options;

    try {
      // Step 1: Detect language
      const language = languageDetector.detectLanguage(voiceText);

      // Step 2: Get user context if enabled
      const userContext = useContext ? contextManager.getUserContext(userId) : undefined;

      // Step 3: Extract intent using OpenAI
      if (!openAIService.isAvailable()) {
        // Fallback to basic processing if OpenAI not available
        return this.fallbackProcessing(voiceText, language, userContext);
      }

      const intentResponse = await openAIService.extractIntent(voiceText, userContext);

      // Step 4: Resolve contextual references
      if (intentResponse.entities.recipient && intentResponse.entities.reference) {
        const resolvedRecipient = contextManager.resolveReference(userId, intentResponse.entities.recipient);
        if (resolvedRecipient) {
          intentResponse.entities.recipient = resolvedRecipient;
          intentResponse.entities.context = "last_recipient";
        }
      }

      // Step 5: Generate suggestions if enabled
      const suggestions = enableSuggestions ? contextManager.getSuggestions(userId, 3) : [];

      // Step 6: Build processed command
      const processedCommand: ProcessedCommand = {
        intent: intentResponse.intent,
        entities: intentResponse.entities,
        language,
        confidence: intentResponse.confidence,
        originalText: voiceText,
        normalizedText: voiceText.toLowerCase().trim(),
        requiresClarification: intentResponse.clarificationNeeded,
        clarificationQuestion: intentResponse.clarificationQuestion,
        suggestions,
      };

      // Step 7: Update context
      if (useContext && !processedCommand.requiresClarification) {
        contextManager.updateContext(userId, processedCommand, true);
      }

      return processedCommand;
    } catch (error: any) {
      console.error("Enhanced processing error:", error);
      throw this.createNLPError("api_error", error.message);
    }
  }

  /**
   * Fallback processing when OpenAI is not available
   */
  private fallbackProcessing(voiceText: string, language: any, userContext: any): ProcessedCommand {
    // Basic regex-based parsing
    const normalizedText = voiceText.toLowerCase();

    // Detect intent
    let intent: ProcessedCommand["intent"] = "unknown";
    if (normalizedText.match(/\b(send|transfer|pay|give)\b/)) {
      intent = "send_money";
    } else if (normalizedText.match(/\b(balance|check|wallet)\b/)) {
      intent = "check_balance";
    } else if (normalizedText.match(/\b(split|divide|share)\b/)) {
      intent = "split_payment";
    }

    // Extract entities
    const amountMatch = normalizedText.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : undefined;

    const ensMatch = normalizedText.match(/([a-z0-9-]+\.eth)/);
    const addressMatch = normalizedText.match(/(0x[a-fA-F0-9]{40})/);
    const recipient = ensMatch ? ensMatch[1] : addressMatch ? addressMatch[1] : undefined;

    return {
      intent,
      entities: { amount, recipient },
      language,
      confidence: 0.6,
      originalText: voiceText,
      normalizedText,
      requiresClarification: !amount || !recipient,
      clarificationQuestion: !amount
        ? "How much would you like to send?"
        : !recipient
          ? "Who would you like to send to?"
          : undefined,
    };
  }

  /**
   * Handle split payment command
   */
  async processSplitPayment(
    voiceText: string,
    userId: string,
  ): Promise<ProcessedCommand> {
    const command = await this.processCommand(voiceText, userId);

    if (command.intent !== "split_payment") {
      return command;
    }

    // Validate split entities
    if (!command.entities.splits || command.entities.splits.length < 2) {
      command.requiresClarification = true;
      command.clarificationQuestion = "Please specify at least 2 recipients for split payment";
      return command;
    }

    // Auto-divide amount if percentages not specified
    if (command.entities.amount && !command.entities.splits.some(s => s.percentage || s.amount)) {
      const totalAmount = parseFloat(command.entities.amount);
      const splitCount = command.entities.splits.length;
      const amountPerPerson = (totalAmount / splitCount).toFixed(2);

      command.entities.splits = command.entities.splits.map(split => ({
        ...split,
        amount: amountPerPerson,
      }));
    }

    return command;
  }

  /**
   * Validate processed command
   */
  validateCommand(command: ProcessedCommand): NLPError | null {
    // Check for send_money requirements
    if (command.intent === "send_money") {
      if (!command.entities.amount) {
        return this.createNLPError("missing_entity", "Amount is required for sending money");
      }
      if (!command.entities.recipient) {
        return this.createNLPError("missing_entity", "Recipient is required for sending money");
      }
      // Validate amount is positive number
      const amount = parseFloat(command.entities.amount);
      if (isNaN(amount) || amount <= 0) {
        return this.createNLPError("invalid_amount", "Amount must be a positive number");
      }
    }

    // Check for split_payment requirements
    if (command.intent === "split_payment") {
      if (!command.entities.splits || command.entities.splits.length < 2) {
        return this.createNLPError("missing_entity", "At least 2 recipients required for split payment");
      }
    }

    return null;
  }

  /**
   * Get localized error message
   */
  getLocalizedError(command: ProcessedCommand, errorType: NLPErrorType): string {
    const errorKey = this.errorTypeToKey(errorType);
    return languageDetector.getLocalizedMessage(errorKey, command.language.language);
  }

  /**
   * Create NLP error
   */
  private createNLPError(type: NLPErrorType, message: string, suggestion?: string): NLPError {
    return {
      type,
      message,
      suggestion,
      clarificationNeeded: true,
    };
  }

  /**
   * Map error type to localization key
   */
  private errorTypeToKey(errorType: NLPErrorType): string {
    const keyMap: Record<NLPErrorType, string> = {
      ambiguous_command: "ambiguous_command",
      missing_entity: "missing_amount",
      invalid_amount: "invalid_amount",
      invalid_address: "invalid_address",
      unsupported_language: "unsupported_language",
      api_error: "transaction_failed",
      context_error: "transaction_failed",
    };
    return keyMap[errorType];
  }

  /**
   * Check if OpenAI is available
   */
  isOpenAIAvailable(): boolean {
    return openAIService.isAvailable();
  }
}

export const enhancedVoiceCommandProcessor = new EnhancedVoiceCommandProcessorService();
