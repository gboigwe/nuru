/**
 * Command Suggestions Service
 *
 * Provides intelligent command suggestions based on:
 * - User's transaction history
 * - Partial voice input
 * - Common payment patterns
 * - Frequently used recipients
 */

import { EXAMPLE_COMMANDS, COMMAND_SUGGESTIONS } from './PromptTemplates';

export interface CommandSuggestion {
  command: string;
  description: string;
  category: 'payment' | 'query' | 'followUp';
  confidence: number;
  fromHistory?: boolean;
}

export interface UserPaymentPattern {
  recipient: string;
  averageAmount: number;
  currency: string;
  frequency: number;
  lastPayment: Date;
}

export class CommandSuggestionsService {
  private paymentHistory: UserPaymentPattern[] = [];
  private recentRecipients: string[] = [];
  private maxHistorySize = 50;

  /**
   * Get command suggestions based on partial input
   */
  getSuggestions(partialInput: string, language: string = 'en'): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const normalized = partialInput.toLowerCase().trim();

    // 1. Match from example commands for the language
    if (EXAMPLE_COMMANDS[language]) {
      EXAMPLE_COMMANDS[language].forEach(example => {
        if (example.toLowerCase().includes(normalized)) {
          suggestions.push({
            command: example,
            description: 'Example command',
            category: this.categorizeCommand(example),
            confidence: this.calculateMatchConfidence(normalized, example),
          });
        }
      });
    }

    // 2. Suggest based on command patterns
    if (normalized.includes('send') || normalized.includes('pay') || normalized.includes('transfer')) {
      COMMAND_SUGGESTIONS.payment.forEach(pattern => {
        suggestions.push({
          command: pattern,
          description: 'Payment command pattern',
          category: 'payment',
          confidence: 0.7,
        });
      });

      // Add recent recipients
      this.recentRecipients.slice(0, 3).forEach(recipient => {
        suggestions.push({
          command: `Send 50 USDC to ${recipient}`,
          description: `Send to ${recipient} (recent)`,
          category: 'payment',
          confidence: 0.9,
          fromHistory: true,
        });
      });
    }

    // 3. Suggest balance and history commands
    if (normalized.includes('balance') || normalized.includes('check') || normalized.includes('how much')) {
      COMMAND_SUGGESTIONS.query.forEach(pattern => {
        suggestions.push({
          command: pattern,
          description: 'Balance query',
          category: 'query',
          confidence: 0.8,
        });
      });
    }

    // 4. Suggest follow-up commands if there's context
    if (this.recentRecipients.length > 0) {
      const lastRecipient = this.recentRecipients[0];
      COMMAND_SUGGESTIONS.followUp.forEach(pattern => {
        const command = pattern.replace('[another person]', 'john.eth').replace('[person]', lastRecipient);
        suggestions.push({
          command,
          description: 'Follow-up command',
          category: 'followUp',
          confidence: 0.75,
        });
      });
    }

    // 5. Add pattern-based suggestions from payment history
    this.paymentHistory.forEach(pattern => {
      if (normalized.includes(pattern.recipient.split('.')[0])) {
        suggestions.push({
          command: `Send ${pattern.averageAmount} ${pattern.currency} to ${pattern.recipient}`,
          description: `Common payment to ${pattern.recipient}`,
          category: 'payment',
          confidence: 0.95,
          fromHistory: true,
        });
      }
    });

    // Sort by confidence and remove duplicates
    return this.deduplicateAndSort(suggestions);
  }

  /**
   * Get smart suggestions based on payment patterns
   */
  getSmartSuggestions(): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];

    // Suggest recurring payments
    this.paymentHistory
      .filter(p => p.frequency > 2)
      .slice(0, 3)
      .forEach(pattern => {
        suggestions.push({
          command: `Send ${pattern.averageAmount} ${pattern.currency} to ${pattern.recipient}`,
          description: `Recurring payment (${pattern.frequency} times)`,
          category: 'payment',
          confidence: 1.0,
          fromHistory: true,
        });
      });

    // Suggest checking balance if no recent activity
    if (this.recentRecipients.length === 0) {
      suggestions.push({
        command: 'Check my balance',
        description: 'Check your current balance',
        category: 'query',
        confidence: 0.8,
      });
    }

    return suggestions;
  }

  /**
   * Learn from completed payment
   */
  learnFromPayment(recipient: string, amount: number, currency: string) {
    // Add to recent recipients
    this.recentRecipients.unshift(recipient);
    this.recentRecipients = this.recentRecipients.slice(0, 10); // Keep last 10

    // Update or add payment pattern
    const existingPattern = this.paymentHistory.find(p => p.recipient === recipient);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.averageAmount = (existingPattern.averageAmount * existingPattern.frequency + amount) / (existingPattern.frequency + 1);
      existingPattern.frequency += 1;
      existingPattern.lastPayment = new Date();
    } else {
      // Add new pattern
      this.paymentHistory.push({
        recipient,
        averageAmount: amount,
        currency,
        frequency: 1,
        lastPayment: new Date(),
      });
    }

    // Keep only top patterns
    this.paymentHistory.sort((a, b) => b.frequency - a.frequency);
    this.paymentHistory = this.paymentHistory.slice(0, this.maxHistorySize);
  }

  /**
   * Get autocomplete suggestions for recipient names
   */
  getRecipientSuggestions(partial: string): string[] {
    const normalized = partial.toLowerCase();

    // Get unique recipients from history
    const allRecipients = [
      ...this.recentRecipients,
      ...this.paymentHistory.map(p => p.recipient),
    ];

    const unique = Array.from(new Set(allRecipients));

    return unique.filter(recipient => recipient.toLowerCase().includes(normalized)).slice(0, 5);
  }

  /**
   * Clear all learned patterns
   */
  clearHistory() {
    this.paymentHistory = [];
    this.recentRecipients = [];
  }

  /**
   * Export payment patterns for persistence
   */
  exportPatterns(): string {
    return JSON.stringify({
      paymentHistory: this.paymentHistory,
      recentRecipients: this.recentRecipients,
    });
  }

  /**
   * Import payment patterns from storage
   */
  importPatterns(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.paymentHistory = parsed.paymentHistory || [];
      this.recentRecipients = parsed.recentRecipients || [];
    } catch (error) {
      console.error('Failed to import patterns:', error);
    }
  }

  // Private helper methods

  private categorizeCommand(command: string): 'payment' | 'query' | 'followUp' {
    const lower = command.toLowerCase();

    if (lower.includes('send') || lower.includes('pay') || lower.includes('transfer') || lower.includes('split')) {
      return 'payment';
    }

    if (lower.includes('balance') || lower.includes('history') || lower.includes('how much')) {
      return 'query';
    }

    return 'followUp';
  }

  private calculateMatchConfidence(partial: string, full: string): number {
    const partialWords = partial.split(' ');
    const fullWords = full.toLowerCase().split(' ');

    let matches = 0;
    partialWords.forEach(word => {
      if (fullWords.some(fw => fw.includes(word))) {
        matches++;
      }
    });

    return Math.min(matches / partialWords.length, 1.0);
  }

  private deduplicateAndSort(suggestions: CommandSuggestion[]): CommandSuggestion[] {
    // Remove duplicates by command text
    const seen = new Set<string>();
    const unique = suggestions.filter(s => {
      if (seen.has(s.command)) {
        return false;
      }
      seen.add(s.command);
      return true;
    });

    // Sort by confidence (descending) and from history first
    return unique.sort((a, b) => {
      if (a.fromHistory && !b.fromHistory) return -1;
      if (!a.fromHistory && b.fromHistory) return 1;
      return b.confidence - a.confidence;
    });
  }
}

// Export singleton instance
export const commandSuggestionsService = new CommandSuggestionsService();
