/**
 * Voice Command History Tracker
 *
 * Tracks and analyzes voice command usage patterns for:
 * - Command accuracy improvements
 * - User behavior analytics
 * - Personalized suggestions
 * - Error pattern detection
 */

export interface VoiceCommandRecord {
  id: string;
  timestamp: Date;
  rawTranscript: string;
  correctedTranscript?: string;
  intent: {
    action: string;
    amount?: string;
    currency?: string;
    recipient?: string;
  };
  confidence: number;
  language: string;
  wasSuccessful: boolean;
  executionTime: number; // milliseconds
  errors?: string[];
  corrections?: string[];
}

export interface CommandAnalytics {
  totalCommands: number;
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  mostCommonRecipients: Array<{ recipient: string; count: number }>;
  mostCommonAmounts: Array<{ amount: string; currency: string; count: number }>;
  languageDistribution: Record<string, number>;
  errorPatterns: Array<{ error: string; count: number }>;
  timeOfDayDistribution: Record<string, number>; // hour -> count
}

export class VoiceCommandHistory {
  private history: VoiceCommandRecord[] = [];
  private maxHistorySize = 1000;
  private storageKey = 'nuru_voice_command_history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new command record to history
   */
  addCommand(record: Omit<VoiceCommandRecord, 'id' | 'timestamp'>): void {
    const fullRecord: VoiceCommandRecord = {
      ...record,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.history.unshift(fullRecord); // Add to beginning

    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    this.saveToStorage();
  }

  /**
   * Get recent command history
   */
  getRecentCommands(limit: number = 10): VoiceCommandRecord[] {
    return this.history.slice(0, limit);
  }

  /**
   * Get all successful payments
   */
  getSuccessfulPayments(): VoiceCommandRecord[] {
    return this.history.filter(r => r.wasSuccessful && r.intent.action === 'send_money');
  }

  /**
   * Get failed commands for analysis
   */
  getFailedCommands(): VoiceCommandRecord[] {
    return this.history.filter(r => !r.wasSuccessful);
  }

  /**
   * Search history by recipient
   */
  findByRecipient(recipient: string): VoiceCommandRecord[] {
    const normalized = recipient.toLowerCase();
    return this.history.filter(r => r.intent.recipient?.toLowerCase().includes(normalized));
  }

  /**
   * Get analytics from command history
   */
  getAnalytics(daysBack: number = 30): CommandAnalytics {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentCommands = this.history.filter(r => r.timestamp >= cutoffDate);

    if (recentCommands.length === 0) {
      return this.getEmptyAnalytics();
    }

    const analytics: CommandAnalytics = {
      totalCommands: recentCommands.length,
      successRate: this.calculateSuccessRate(recentCommands),
      averageConfidence: this.calculateAverageConfidence(recentCommands),
      averageExecutionTime: this.calculateAverageExecutionTime(recentCommands),
      mostCommonRecipients: this.getMostCommonRecipients(recentCommands),
      mostCommonAmounts: this.getMostCommonAmounts(recentCommands),
      languageDistribution: this.getLanguageDistribution(recentCommands),
      errorPatterns: this.getErrorPatterns(recentCommands),
      timeOfDayDistribution: this.getTimeOfDayDistribution(recentCommands),
    };

    return analytics;
  }

  /**
   * Get command suggestions based on history
   */
  getSuggestedCommands(): string[] {
    const suggestions: string[] = [];

    // Get most frequent recipients
    const recipients = this.getMostCommonRecipients(this.history).slice(0, 3);

    recipients.forEach(({ recipient }) => {
      const lastPayment = this.findByRecipient(recipient)[0];
      if (lastPayment && lastPayment.intent.amount && lastPayment.intent.currency) {
        suggestions.push(`Send ${lastPayment.intent.amount} ${lastPayment.intent.currency} to ${recipient}`);
      }
    });

    return suggestions;
  }

  /**
   * Detect if user is repeating a failed command
   */
  isRepeatFailure(transcript: string): boolean {
    const recent = this.history.slice(0, 5);
    const failedSimilar = recent.find(
      r => !r.wasSuccessful && this.calculateSimilarity(r.rawTranscript, transcript) > 0.8,
    );

    return failedSimilar !== undefined;
  }

  /**
   * Get correction suggestions based on past errors
   */
  getCorrectionSuggestions(transcript: string): string[] {
    const suggestions: string[] = [];

    // Find similar failed commands that were later corrected
    this.history.forEach(record => {
      if (record.correctedTranscript && this.calculateSimilarity(record.rawTranscript, transcript) > 0.7) {
        suggestions.push(record.correctedTranscript);
      }
    });

    return Array.from(new Set(suggestions)); // Remove duplicates
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * Export history as JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Import history from JSON
   */
  importHistory(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.history = imported.map(record => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }

  // Private helper methods

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  }

  private calculateSuccessRate(commands: VoiceCommandRecord[]): number {
    const successful = commands.filter(r => r.wasSuccessful).length;
    return (successful / commands.length) * 100;
  }

  private calculateAverageConfidence(commands: VoiceCommandRecord[]): number {
    const sum = commands.reduce((acc, r) => acc + r.confidence, 0);
    return sum / commands.length;
  }

  private calculateAverageExecutionTime(commands: VoiceCommandRecord[]): number {
    const sum = commands.reduce((acc, r) => acc + r.executionTime, 0);
    return sum / commands.length;
  }

  private getMostCommonRecipients(commands: VoiceCommandRecord[]): Array<{ recipient: string; count: number }> {
    const counts: Record<string, number> = {};

    commands.forEach(record => {
      if (record.intent.recipient) {
        counts[record.intent.recipient] = (counts[record.intent.recipient] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([recipient, count]) => ({ recipient, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getMostCommonAmounts(commands: VoiceCommandRecord[]): Array<{ amount: string; currency: string; count: number }> {
    const counts: Record<string, number> = {};

    commands.forEach(record => {
      if (record.intent.amount && record.intent.currency) {
        const key = `${record.intent.amount}_${record.intent.currency}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => {
        const [amount, currency] = key.split('_');
        return { amount, currency, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  private getLanguageDistribution(commands: VoiceCommandRecord[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    commands.forEach(record => {
      distribution[record.language] = (distribution[record.language] || 0) + 1;
    });

    return distribution;
  }

  private getErrorPatterns(commands: VoiceCommandRecord[]): Array<{ error: string; count: number }> {
    const counts: Record<string, number> = {};

    commands.forEach(record => {
      record.errors?.forEach(error => {
        counts[error] = (counts[error] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getTimeOfDayDistribution(commands: VoiceCommandRecord[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    commands.forEach(record => {
      const hour = record.timestamp.getHours().toString();
      distribution[hour] = (distribution[hour] || 0) + 1;
    });

    return distribution;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getEmptyAnalytics(): CommandAnalytics {
    return {
      totalCommands: 0,
      successRate: 0,
      averageConfidence: 0,
      averageExecutionTime: 0,
      mostCommonRecipients: [],
      mostCommonAmounts: [],
      languageDistribution: {},
      errorPatterns: [],
      timeOfDayDistribution: {},
    };
  }
}

// Export singleton instance
export const voiceCommandHistory = new VoiceCommandHistory();
