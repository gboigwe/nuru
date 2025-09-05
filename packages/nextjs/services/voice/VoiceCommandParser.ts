/**
 * Real Voice Command Parser for Nuru MVP
 * Parses voice transcriptions into payment intents
 */

export interface ParsedPaymentCommand {
  success: boolean;
  amount: string;
  currency: string;
  recipientENS: string;
  action: 'send' | 'transfer' | 'pay';
  confidence: number;
  error?: string;
  originalTranscript: string;
}

export interface PaymentIntent {
  amount: string;
  currency: string;
  recipientENS: string;
  recipientAddress?: string;
  metadata: {
    action: string;
    originalCommand: string;
    parsedAt: number;
    confidence: number;
  };
}

export class VoiceCommandParser {
  private readonly CURRENCY_PATTERNS = {
    cedis: ['cedis', 'cedi', 'ghana cedis', 'ghs'],
    usdc: ['usdc', 'usd coin', 'us dollar coin'],
    usd: ['dollars', 'dollar', 'usd', 'us dollars'],
    eth: ['eth', 'ethereum', 'ether'],
    naira: ['naira', 'ngn', 'nigeria naira']
  };

  private readonly ACTION_PATTERNS = {
    send: ['send', 'transfer', 'give', 'remit'],
    pay: ['pay', 'payment to'],
    transfer: ['transfer', 'move', 'wire']
  };

  private readonly ENS_PATTERN = /([a-z0-9-]+\.(?:eth|ens\.eth|family\.eth|ghana\.eth|nigeria\.eth))/gi;
  private readonly AMOUNT_PATTERN = /(\d+(?:\.\d{1,4})?)/g;

  /**
   * Parse voice transcript into payment command
   */
  parseVoiceCommand(transcript: string): ParsedPaymentCommand {
    const cleanTranscript = transcript.toLowerCase().trim();
    
    try {
      // Extract action
      const action = this.extractAction(cleanTranscript);
      if (!action) {
        return {
          success: false,
          error: 'No payment action detected (send, transfer, pay)',
          amount: '',
          currency: '',
          recipientENS: '',
          action: 'send',
          confidence: 0,
          originalTranscript: transcript
        };
      }

      // Extract amount
      const amount = this.extractAmount(cleanTranscript);
      if (!amount) {
        return {
          success: false,
          error: 'No amount detected in voice command',
          amount: '',
          currency: '',
          recipientENS: '',
          action,
          confidence: 0,
          originalTranscript: transcript
        };
      }

      // Extract currency
      const currency = this.extractCurrency(cleanTranscript);
      if (!currency) {
        return {
          success: false,
          error: 'No currency detected (cedis, USDC, dollars, ETH)',
          amount,
          currency: '',
          recipientENS: '',
          action,
          confidence: 0.3,
          originalTranscript: transcript
        };
      }

      // Extract ENS name
      const recipientENS = this.extractENS(cleanTranscript);
      if (!recipientENS) {
        return {
          success: false,
          error: 'No ENS name detected (e.g., mama.family.eth)',
          amount,
          currency,
          recipientENS: '',
          action,
          confidence: 0.5,
          originalTranscript: transcript
        };
      }

      // Calculate confidence based on pattern matches
      const confidence = this.calculateConfidence(cleanTranscript, action, amount, currency, recipientENS);

      return {
        success: true,
        amount,
        currency,
        recipientENS,
        action,
        confidence,
        originalTranscript: transcript
      };

    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        amount: '',
        currency: '',
        recipientENS: '',
        action: 'send',
        confidence: 0,
        originalTranscript: transcript
      };
    }
  }

  /**
   * Convert parsed command to payment intent
   */
  createPaymentIntent(parsed: ParsedPaymentCommand): PaymentIntent | null {
    if (!parsed.success) return null;

    return {
      amount: parsed.amount,
      currency: parsed.currency.toUpperCase(),
      recipientENS: parsed.recipientENS,
      metadata: {
        action: parsed.action,
        originalCommand: parsed.originalTranscript,
        parsedAt: Date.now(),
        confidence: parsed.confidence
      }
    };
  }

  // Private helper methods

  private extractAction(transcript: string): 'send' | 'transfer' | 'pay' | null {
    for (const [action, patterns] of Object.entries(this.ACTION_PATTERNS)) {
      if (patterns.some(pattern => transcript.includes(pattern))) {
        return action as 'send' | 'transfer' | 'pay';
      }
    }
    return null;
  }

  private extractAmount(transcript: string): string | null {
    const matches = transcript.match(this.AMOUNT_PATTERN);
    if (!matches) return null;
    
    // Take the first reasonable amount (between 0.01 and 1,000,000)
    for (const match of matches) {
      const amount = parseFloat(match);
      if (amount >= 0.01 && amount <= 1000000) {
        return amount.toString();
      }
    }
    
    return matches[0]; // Fallback to first match
  }

  private extractCurrency(transcript: string): string | null {
    for (const [currency, patterns] of Object.entries(this.CURRENCY_PATTERNS)) {
      if (patterns.some(pattern => transcript.includes(pattern))) {
        return currency;
      }
    }
    return null;
  }

  private extractENS(transcript: string): string | null {
    const matches = transcript.match(this.ENS_PATTERN);
    if (!matches || matches.length === 0) return null;
    
    // Return the first valid ENS name found
    return matches[0].toLowerCase();
  }

  private calculateConfidence(
    transcript: string,
    action: string,
    amount: string,
    currency: string,
    ensName: string
  ): number {
    let confidence = 0.6; // Base confidence
    
    // Boost confidence for clear patterns
    if (transcript.includes(`${action} ${amount}`)) confidence += 0.1;
    if (transcript.includes(`${amount} ${currency}`)) confidence += 0.1;
    if (transcript.includes(`to ${ensName}`)) confidence += 0.1;
    if (transcript.length > 10 && transcript.length < 100) confidence += 0.1;
    
    // Reduce confidence for ambiguous cases
    if (parseFloat(amount) > 1000000) confidence -= 0.2;
    if (!ensName.includes('.')) confidence -= 0.3;
    
    return Math.max(0.1, Math.min(0.99, confidence));
  }

  /**
   * Validate ENS name format
   */
  isValidENS(ensName: string): boolean {
    return this.ENS_PATTERN.test(ensName);
  }

  /**
   * Get suggested corrections for failed parse
   */
  getSuggestions(transcript: string): string[] {
    const suggestions: string[] = [];
    
    if (!this.extractAction(transcript)) {
      suggestions.push('Try starting with "Send", "Transfer", or "Pay"');
    }
    
    if (!this.extractAmount(transcript)) {
      suggestions.push('Include a clear amount like "50" or "100.5"');
    }
    
    if (!this.extractCurrency(transcript)) {
      suggestions.push('Specify currency: "cedis", "USDC", "dollars", or "ETH"');
    }
    
    if (!this.extractENS(transcript)) {
      suggestions.push('Include ENS name like "mama.family.eth" or "friend.eth"');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try: "Send 50 cedis to mama.family.eth"');
    }
    
    return suggestions;
  }

  /**
   * Test examples for demo
   */
  getTestCommands(): string[] {
    return [
      "Send 50 cedis to mama.family.eth",
      "Transfer 100 USDC to friend.eth", 
      "Pay kofi.ghana.eth 25 dollars",
      "Send 0.1 ETH to sister.ens.eth",
      "Transfer 75 naira to brother.nigeria.eth"
    ];
  }
}

// Export singleton instance
export const voiceCommandParser = new VoiceCommandParser();