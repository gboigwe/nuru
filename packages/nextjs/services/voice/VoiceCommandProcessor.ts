/**
 * Voice Command Processor for VoicePay Africa
 * Handles voice command parsing and payment intent extraction with GPT-4 NLP
 */

import { openAIService, PaymentIntent as AIPaymentIntent } from '../ai/OpenAIService';
import { getErrorMessage } from '../ai/PromptTemplates';

export interface PaymentIntent {
  action: 'send_money' | 'check_balance' | 'transaction_history' | 'cancel_payment' | 'split_payment';
  amount: string;
  currency: 'cedis' | 'dollars' | 'usdc' | 'eth' | 'ghs' | 'ngn' | 'kes' | 'usd';
  recipient: string; // ENS name or address
  recipients?: Array<{ address: string; amount: string }>; // For split payments
  confidence: number;
  rawTranscript: string;
  language: 'en' | 'tw' | 'ha' | 'ig' | 'yo' | 'fr' | 'sw'; // Expanded language support
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  suggestedCorrection?: string;
  metadata: {
    timestamp: number;
    processingTime: number;
    patterns: string[];
    useGPT4?: boolean;
  };
}

export interface VoicePatternMatch {
  pattern: RegExp;
  language: string;
  action: string;
  confidence: number;
}

export class VoiceCommandProcessor {
  private readonly CONFIDENCE_THRESHOLD = 0.8;
  
  // Voice command patterns for different languages
  private readonly VOICE_PATTERNS: VoicePatternMatch[] = [
    // English patterns
    {
      pattern: /(?:send|transfer|pay)\s+(?:(\d+(?:\.\d+)?)|(\w+))\s+(cedis|dollars|usdc|eth)\s+to\s+([a-zA-Z0-9\-\.]+\.eth|\w+\.\w+\.\w+)/i,
      language: 'en',
      action: 'send_money',
      confidence: 0.95
    },
    {
      pattern: /pay\s+([a-zA-Z0-9\-\.]+\.eth|\w+\.\w+\.\w+)\s+(?:(\d+(?:\.\d+)?)|(\w+))\s+(cedis|dollars|usdc|eth)/i,
      language: 'en',
      action: 'send_money',
      confidence: 0.9
    },
    {
      pattern: /(?:check|what's|whats)\s+(?:my\s+)?balance/i,
      language: 'en',
      action: 'check_balance',
      confidence: 0.85
    },
    {
      pattern: /(?:show|get)\s+(?:my\s+)?(?:transaction\s+)?history/i,
      language: 'en',
      action: 'transaction_history',
      confidence: 0.8
    },
    
    // Twi patterns
    {
      pattern: /(?:fa|soma|tua)\s+(?:(\d+(?:\.\d+)?)|(\w+))\s+(cedis|dollars|usdc|eth)\s+(?:kɔma|ma)\s+([a-zA-Z0-9\-\.]+\.eth|\w+\.\w+\.\w+)/i,
      language: 'tw',
      action: 'send_money',
      confidence: 0.9
    },
    {
      pattern: /(?:hwɛ|ma\s+me\s+hu)\s+me\s+sika/i,
      language: 'tw',
      action: 'check_balance',
      confidence: 0.85
    },
    
    // Hausa patterns
    {
      pattern: /(?:aika|tura|biya)\s+(?:(\d+(?:\.\d+)?)|(\w+))\s+(cedis|dollars|usdc|eth)\s+(?:zuwa|ga)\s+([a-zA-Z0-9\-\.]+\.eth|\w+\.\w+\.\w+)/i,
      language: 'ha',
      action: 'send_money',
      confidence: 0.9
    },
    {
      pattern: /(?:duba|nuna)\s+(?:kudin\s+na|ma\s+kudin)/i,
      language: 'ha',
      action: 'check_balance',
      confidence: 0.85
    }
  ];

  // Number word mappings for different languages
  private readonly NUMBER_WORDS = {
    en: {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
      'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
      'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
      'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
    },
    tw: {
      'baako': '1', 'mmienu': '2', 'mmiɛnsa': '3', 'ɛnan': '4', 'enum': '5',
      'nsia': '6', 'nson': '7', 'nwɔtwe': '8', 'nkron': '9', 'du': '10',
      'dubaako': '11', 'dummienu': '12', 'aduonu': '20', 'aduasa': '30',
      'aduanan': '40', 'aduonum': '50', 'ɔha': '100'
    },
    ha: {
      'daya': '1', 'biyu': '2', 'uku': '3', 'hudu': '4', 'biyar': '5',
      'shida': '6', 'bakwai': '7', 'takwas': '8', 'tara': '9', 'goma': '10',
      'ashirin': '20', 'talatin': '30', 'arba\'in': '40', 'hamsin': '50',
      'sittin': '60', 'saba\'in': '70', 'tamanin': '80', 'casa\'in': '90', 'dari': '100'
    }
  };

  // Currency mappings
  private readonly CURRENCY_MAPPINGS = {
    'ghana cedis': 'cedis',
    'cedi': 'cedis',
    'ghanaian cedi': 'cedis',
    'dollar': 'dollars',
    'us dollar': 'dollars',
    'american dollar': 'dollars',
    'usdc': 'usdc',
    'usd coin': 'usdc',
    'ethereum': 'eth',
    'ether': 'eth'
  };

  /**
   * Extract payment intent from voice transcript
   * Uses GPT-4 for advanced NLP, falls back to regex if unavailable
   */
  async extractPaymentIntent(transcript: string, language: string = 'en'): Promise<PaymentIntent | null> {
    const startTime = Date.now();
    const correctedTranscript = this.correctVoiceRecognitionErrors(transcript);
    const cleanedTranscript = this.cleanTranscript(correctedTranscript);

    if (!cleanedTranscript) {
      return null;
    }

    try {
      // Try GPT-4 first for advanced NLP
      const aiIntent = await openAIService.extractPaymentIntent(cleanedTranscript, language);
      const processingTime = Date.now() - startTime;

      // Convert AI intent to our PaymentIntent format
      const intent: PaymentIntent = {
        action: aiIntent.action as PaymentIntent['action'],
        amount: aiIntent.amount || '0',
        currency: this.normalizeCurrency(aiIntent.currency) as PaymentIntent['currency'],
        recipient: aiIntent.recipient || '',
        recipients: aiIntent.recipients,
        confidence: aiIntent.confidence,
        rawTranscript: transcript,
        language: language as PaymentIntent['language'],
        clarificationNeeded: aiIntent.clarificationNeeded,
        clarificationQuestion: aiIntent.clarificationQuestion,
        suggestedCorrection: aiIntent.suggestedCorrection,
        metadata: {
          timestamp: Date.now(),
          processingTime,
          patterns: ['gpt-4-turbo-preview'],
          useGPT4: true,
        },
      };

      return intent;
    } catch (error) {
      console.warn('GPT-4 NLP failed, falling back to regex parsing:', error);

      // Fallback to regex-based parsing
      const detectedLanguage = this.detectLanguage(cleanedTranscript);

      // Try to match patterns
      const matchedPatterns: string[] = [];
      let bestMatch: { pattern: VoicePatternMatch; matches: RegExpMatchArray } | null = null;
      let highestConfidence = 0;

      for (const voicePattern of this.VOICE_PATTERNS) {
        const match = cleanedTranscript.match(voicePattern.pattern);
        if (match) {
          matchedPatterns.push(voicePattern.pattern.source);
          if (voicePattern.confidence > highestConfidence) {
            highestConfidence = voicePattern.confidence;
            bestMatch = { pattern: voicePattern, matches: match };
          }
        }
      }

      if (!bestMatch || highestConfidence < this.CONFIDENCE_THRESHOLD) {
        return null;
      }

      // Extract payment details
      const intent = await this.buildPaymentIntent(
        bestMatch,
        cleanedTranscript,
        detectedLanguage,
        matchedPatterns,
        Date.now() - startTime
      );

      return intent;
    }
  }

  /**
   * Validate voice command for financial transactions
   */
  validateVoiceCommand(intent: PaymentIntent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check confidence
    if (intent.confidence < this.CONFIDENCE_THRESHOLD) {
      errors.push(`Voice recognition confidence too low: ${intent.confidence}`);
    }

    // Check amount
    if (intent.action === 'send_money') {
      const amount = parseFloat(intent.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Invalid amount specified');
      }
      if (amount > 10000) {
        errors.push('Amount exceeds maximum limit');
      }
      if (amount < 0.01) {
        errors.push('Amount below minimum limit');
      }
    }

    // Check recipient format
    if (intent.action === 'send_money' && intent.recipient) {
      if (!this.isValidRecipientFormat(intent.recipient)) {
        errors.push('Invalid recipient format');
      }
    }

    // Check currency
    if (intent.currency && !['cedis', 'dollars', 'usdc', 'eth'].includes(intent.currency)) {
      errors.push('Unsupported currency');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle common voice recognition errors and corrections
   */
  correctVoiceRecognitionErrors(transcript: string): string {
    let corrected = transcript;

    // Common ENS misrecognitions
    const ensCorrections = {
      'dot e t h': '.eth',
      'dot eat': '.eth',
      'dot if': '.eth',
      'dot each': '.eth',
      'family dot': 'family.',
      'pay dot': 'pay.',
      'wallet dot': 'wallet.'
    };

    // Apply ENS corrections
    Object.entries(ensCorrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    });

    // Common currency misrecognitions
    const currencyCorrections = {
      'cedar': 'cedis',
      'cities': 'cedis',
      'seeds': 'cedis',
      'see this': 'cedis',
      'you as the sea': 'usdc',
      'us the sea': 'usdc',
      'ethereum': 'eth',
      'ether': 'eth'
    };

    Object.entries(currencyCorrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    });

    // Common action misrecognitions
    const actionCorrections = {
      'sent to': 'send to',
      'sent money': 'send money',
      'pay to': 'pay',
      'transfer to': 'transfer'
    };

    Object.entries(actionCorrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    });

    return corrected;
  }

  /**
   * Get suggested commands based on partial transcript
   */
  getSuggestedCommands(partialTranscript: string): string[] {
    const suggestions: string[] = [];
    const cleaned = partialTranscript.toLowerCase().trim();

    if (cleaned.includes('send') || cleaned.includes('pay') || cleaned.includes('transfer')) {
      suggestions.push('Send 50 cedis to mama.family.eth');
      suggestions.push('Pay kofi.ghana.eth 100 dollars');
      suggestions.push('Transfer 25 USDC to friend.wallet.eth');
    }

    if (cleaned.includes('balance') || cleaned.includes('check')) {
      suggestions.push('Check my balance');
      suggestions.push('What\'s my balance');
    }

    if (cleaned.includes('history') || cleaned.includes('transactions')) {
      suggestions.push('Show my transaction history');
      suggestions.push('Get my payment history');
    }

    return suggestions;
  }

  // Private helper methods

  private cleanTranscript(transcript: string): string {
    if (!transcript) return '';
    
    return transcript
      .trim()
      .toLowerCase()
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove punctuation that might interfere
      .replace(/[,!?;]/g, '')
      // Apply voice recognition corrections
      .split(' ')
      .map(word => this.correctVoiceRecognitionErrors(word))
      .join(' ');
  }

  private detectLanguage(transcript: string): 'en' | 'tw' | 'ha' | 'ig' | 'yo' {
    // Enhanced language detection based on common words
    const twiWords = ['fa', 'kɔma', 'sika', 'hwɛ', 'me', 'wo', 'meda', 'ase'];
    const hausaWords = ['aika', 'zuwa', 'kudin', 'na', 'duba', 'nuna', 'ga'];
    const igboWords = ['zipu', 'ziga', 'ego', 'nye', 'onye', 'nwere'];
    const yorubaWords = ['fi', 'ranṣẹ', 'owo', 'si', 'fun', 'lati'];

    const words = transcript.toLowerCase().split(' ');

    const twiMatches = words.filter(word => twiWords.includes(word)).length;
    const hausaMatches = words.filter(word => hausaWords.includes(word)).length;
    const igboMatches = words.filter(word => igboWords.includes(word)).length;
    const yorubaMatches = words.filter(word => yorubaWords.includes(word)).length;

    if (twiMatches > 0) return 'tw';
    if (hausaMatches > 0) return 'ha';
    if (igboMatches > 0) return 'ig';
    if (yorubaMatches > 0) return 'yo';
    return 'en'; // Default to English
  }

  private async buildPaymentIntent(
    bestMatch: { pattern: VoicePatternMatch; matches: RegExpMatchArray },
    transcript: string,
    language: 'en' | 'tw' | 'ha' | 'ig' | 'yo',
    matchedPatterns: string[],
    processingTime: number
  ): Promise<PaymentIntent> {
    const { pattern, matches } = bestMatch;

    // Extract components based on pattern
    let amount = '';
    let currency = 'cedis'; // default
    let recipient = '';

    if (pattern.action === 'send_money') {
      // Extract amount (could be numeric or word)
      const numericAmount = matches[1];
      const wordAmount = matches[2];
      amount = numericAmount || this.convertWordsToNumber(wordAmount, language);

      // Extract currency
      const rawCurrency = matches[3] || matches[4];
      currency = this.normalizeCurrency(rawCurrency);

      // Extract recipient
      recipient = matches[4] || matches[5] || '';
      recipient = this.normalizeRecipient(recipient);
    }

    return {
      action: pattern.action as PaymentIntent['action'],
      amount,
      currency: currency as PaymentIntent['currency'],
      recipient,
      confidence: pattern.confidence,
      rawTranscript: transcript,
      language,
      metadata: {
        timestamp: Date.now(),
        processingTime,
        patterns: matchedPatterns,
        useGPT4: false,
      },
    };
  }

  private convertWordsToNumber(word: string, language: 'en' | 'tw' | 'ha'): string {
    if (!word) return '0';
    
    const numberWords = this.NUMBER_WORDS[language];
    return numberWords[word.toLowerCase()] || word;
  }

  private normalizeCurrency(currency: string): string {
    if (!currency) return 'usdc';

    const normalized = currency.toLowerCase().trim();
    const mapped = this.CURRENCY_MAPPINGS[normalized] || normalized;

    // Map common variations
    if (['cedis', 'cedi', 'ghs', 'ghana cedis'].includes(mapped)) return 'ghs';
    if (['dollars', 'dollar', 'usd', 'us dollar'].includes(mapped)) return 'usd';
    if (['usdc', 'usd coin'].includes(mapped)) return 'usdc';
    if (['eth', 'ethereum', 'ether'].includes(mapped)) return 'eth';
    if (['ngn', 'naira'].includes(mapped)) return 'ngn';
    if (['kes', 'shilling'].includes(mapped)) return 'kes';

    return mapped;
  }

  private normalizeRecipient(recipient: string): string {
    if (!recipient) return '';
    
    return recipient
      .toLowerCase()
      .trim()
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '');
  }

  private isValidRecipientFormat(recipient: string): boolean {
    // Check if it's an ENS name or Basename
    if (recipient.endsWith('.eth') || recipient.endsWith('.base.eth')) {
      return /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\.(base\.)?eth$/.test(recipient);
    }

    // Check if it's an Ethereum address
    if (recipient.startsWith('0x')) {
      return /^0x[a-fA-F0-9]{40}$/.test(recipient);
    }

    return false;
  }

  /**
   * Get context from OpenAI service for follow-up commands
   */
  getConversationContext() {
    return openAIService.getContext();
  }

  /**
   * Clear conversation context
   */
  clearConversationContext() {
    openAIService.clearContext();
  }

  /**
   * Set conversation context (e.g., after page reload)
   */
  setConversationContext(context: any) {
    openAIService.setContext(context);
  }
}

// Export singleton instance
export const voiceCommandProcessor = new VoiceCommandProcessor();