/**
 * Context Manager Service
 *
 * Manages user conversation history and context for voice commands
 * Enables pronoun resolution and contextual references
 */

import type { UserContext, ConversationTurn, ProcessedCommand } from "~~/types/nlp";

class ContextManagerService {
  private contexts: Map<string, UserContext> = new Map();
  private readonly MAX_HISTORY = 10;
  private readonly MAX_RECIPIENTS = 5;

  /**
   * Get or create user context
   */
  getUserContext(userId: string): UserContext {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, {
        userId,
        recentRecipients: [],
        recentAmounts: [],
        conversationHistory: [],
      });
    }
    return this.contexts.get(userId)!;
  }

  /**
   * Update context after successful command
   */
  updateContext(userId: string, command: ProcessedCommand, successful: boolean): void {
    const context = this.getUserContext(userId);

    // Add to conversation history
    const turn: ConversationTurn = {
      timestamp: new Date(),
      userInput: command.originalText,
      processedCommand: command,
      successful,
    };

    context.conversationHistory.unshift(turn);

    // Limit history size
    if (context.conversationHistory.length > this.MAX_HISTORY) {
      context.conversationHistory = context.conversationHistory.slice(0, this.MAX_HISTORY);
    }

    // Update recent recipients
    if (successful && command.entities.recipient) {
      this.addRecentRecipient(context, command.entities.recipient);
    }

    // Update recent amounts
    if (successful && command.entities.amount && command.entities.currency) {
      this.addRecentAmount(context, command.entities.amount, command.entities.currency);
    }

    // Update preferred language
    if (command.language) {
      context.preferredLanguage = command.language.language;
    }

    // Update preferred currency
    if (command.entities.currency && !context.preferredCurrency) {
      context.preferredCurrency = command.entities.currency;
    }
  }

  /**
   * Add recent recipient to context
   */
  private addRecentRecipient(context: UserContext, recipient: string): void {
    // Remove if already exists
    context.recentRecipients = context.recentRecipients.filter(r => r.address !== recipient);

    // Add to front
    context.recentRecipients.unshift({
      address: recipient,
      lastUsed: new Date(),
    });

    // Limit size
    if (context.recentRecipients.length > this.MAX_RECIPIENTS) {
      context.recentRecipients = context.recentRecipients.slice(0, this.MAX_RECIPIENTS);
    }
  }

  /**
   * Add recent amount to context
   */
  private addRecentAmount(context: UserContext, amount: string, currency: string): void {
    context.recentAmounts.unshift({
      amount,
      currency,
      timestamp: new Date(),
    });

    // Limit size
    if (context.recentAmounts.length > this.MAX_HISTORY) {
      context.recentAmounts = context.recentAmounts.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Resolve contextual reference (e.g., "same person as last time")
   */
  resolveReference(userId: string, reference: string): string | null {
    const context = this.getUserContext(userId);

    // Check for "last" or "same" references
    if (reference.match(/\b(last|same|previous)\b/i)) {
      if (context.recentRecipients.length > 0) {
        return context.recentRecipients[0].address;
      }
    }

    // Check for positional references (e.g., "first one", "second person")
    const posMatch = reference.match(/\b(first|second|third)\b/i);
    if (posMatch) {
      const positions: Record<string, number> = { first: 0, second: 1, third: 2 };
      const index = positions[posMatch[1].toLowerCase()];
      if (context.recentRecipients[index]) {
        return context.recentRecipients[index].address;
      }
    }

    return null;
  }

  /**
   * Get command suggestions based on context
   */
  getSuggestions(userId: string, count: number = 3): string[] {
    const context = this.getUserContext(userId);
    const suggestions: string[] = [];

    // Suggest recent successful commands
    const successfulCommands = context.conversationHistory
      .filter(turn => turn.successful && turn.processedCommand.intent === "send_money")
      .slice(0, count);

    for (const turn of successfulCommands) {
      const cmd = turn.processedCommand;
      if (cmd.entities.amount && cmd.entities.recipient && cmd.entities.currency) {
        suggestions.push(`Send ${cmd.entities.amount} ${cmd.entities.currency} to ${cmd.entities.recipient}`);
      }
    }

    // Add suggestions for common patterns
    if (context.recentRecipients.length > 0 && suggestions.length < count) {
      const lastRecipient = context.recentRecipients[0];
      const lastAmount = context.recentAmounts[0];

      if (lastAmount) {
        suggestions.push(`Send ${lastAmount.amount} ${lastAmount.currency} to ${lastRecipient.address}`);
      } else {
        suggestions.push(`Send to ${lastRecipient.address}`);
      }
    }

    return suggestions.slice(0, count);
  }

  /**
   * Clear user context
   */
  clearContext(userId: string): void {
    this.contexts.delete(userId);
  }

  /**
   * Get last successful command
   */
  getLastSuccessfulCommand(userId: string): ProcessedCommand | null {
    const context = this.getUserContext(userId);
    const lastSuccessful = context.conversationHistory.find(turn => turn.successful);
    return lastSuccessful?.processedCommand || null;
  }

  /**
   * Check if user has context
   */
  hasContext(userId: string): boolean {
    const context = this.contexts.get(userId);
    return context ? context.conversationHistory.length > 0 : false;
  }

  /**
   * Get context summary for debugging
   */
  getContextSummary(userId: string): string {
    const context = this.getUserContext(userId);
    return JSON.stringify(
      {
        userId: context.userId,
        recentRecipients: context.recentRecipients.length,
        recentAmounts: context.recentAmounts.length,
        conversationHistory: context.conversationHistory.length,
        preferredLanguage: context.preferredLanguage,
        preferredCurrency: context.preferredCurrency,
      },
      null,
      2,
    );
  }
}

export const contextManager = new ContextManagerService();
