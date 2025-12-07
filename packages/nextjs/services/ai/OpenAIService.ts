/**
 * OpenAI GPT-4 Service for Voice Command Natural Language Processing
 *
 * This service uses OpenAI's GPT-4 to intelligently parse voice commands,
 * extract payment intents, and provide context-aware responses.
 *
 * Features:
 * - Advanced intent extraction from natural language
 * - Context retention across multiple commands
 * - Multi-language support (English, Twi, Ga, Pidgin, Hausa)
 * - Ambiguity handling with clarification requests
 * - Complex command parsing (split payments, batch transactions)
 * - Error correction and command suggestions
 */

export interface PaymentIntent {
  action: 'send_money' | 'check_balance' | 'transaction_history' | 'split_payment';
  amount: string;
  currency: string;
  recipient: string;
  recipients?: Array<{ address: string; amount: string }>; // For split payments
  confidence: number;
  language: string;
  rawTranscript: string;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  suggestedCorrection?: string;
}

export interface ConversationContext {
  previousRecipient?: string;
  previousAmount?: string;
  previousCurrency?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp: number;
}

export class OpenAIService {
  private apiKey: string;
  private model: string = 'gpt-4-turbo-preview';
  private context: ConversationContext;
  private maxContextAge: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.context = {
      conversationHistory: [],
      timestamp: Date.now(),
    };

    if (!this.apiKey) {
      console.warn('OpenAI API key not configured. Voice NLP will use fallback parsing.');
    }
  }

  /**
   * Extract payment intent from voice command using GPT-4
   */
  async extractPaymentIntent(transcript: string, language: string = 'en'): Promise<PaymentIntent> {
    // Check if context is stale
    if (Date.now() - this.context.timestamp > this.maxContextAge) {
      this.clearContext();
    }

    if (!this.apiKey) {
      return this.fallbackParsing(transcript, language);
    }

    try {
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(transcript, language);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.context.conversationHistory,
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // Lower temperature for more consistent parsing
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        return this.fallbackParsing(transcript, language);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const intent = JSON.parse(content);

      // Update context
      this.context.conversationHistory.push(
        { role: 'user', content: transcript },
        { role: 'assistant', content: JSON.stringify(intent) },
      );

      // Keep only last 10 exchanges to manage context size
      if (this.context.conversationHistory.length > 20) {
        this.context.conversationHistory = this.context.conversationHistory.slice(-20);
      }

      // Update context with current intent
      if (intent.action === 'send_money') {
        this.context.previousRecipient = intent.recipient;
        this.context.previousAmount = intent.amount;
        this.context.previousCurrency = intent.currency;
      }
      this.context.timestamp = Date.now();

      return {
        ...intent,
        rawTranscript: transcript,
        language,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.fallbackParsing(transcript, language);
    }
  }

  /**
   * Build system prompt based on language
   */
  private getSystemPrompt(language: string): string {
    const basePrompt = `You are an AI assistant specialized in parsing voice commands for cryptocurrency payments on the BASE blockchain.

Your task is to extract structured payment information from natural language commands in various African languages and dialects.

Supported currencies: USDC, ETH, GHS (Ghana Cedis), NGN (Nigerian Naira), KES (Kenyan Shilling), USD
Supported recipient formats: ENS names (.eth), Basenames (.base.eth), Ethereum addresses (0x...)

Context awareness:
- Remember previous recipients, amounts, and currencies from the conversation
- Handle follow-up commands like "send the same to John" or "double that amount"
- Understand relative references like "to the same person" or "send again"

Complex commands:
- Split payments: "split 100 USDC between Alice and Bob"
- Batch payments: "send 50 cedis to mama.eth and 30 dollars to papa.eth"

Output format (JSON):
{
  "action": "send_money|check_balance|transaction_history|split_payment",
  "amount": "number as string",
  "currency": "usdc|eth|ghs|ngn|kes|usd",
  "recipient": "ens name or address",
  "recipients": [{"address": "...", "amount": "..."}], // Only for split_payment
  "confidence": 0.0-1.0,
  "clarificationNeeded": boolean,
  "clarificationQuestion": "string if clarification needed",
  "suggestedCorrection": "string if there's ambiguity"
}

If the command is ambiguous or incomplete, set clarificationNeeded to true and provide a clarificationQuestion.`;

    const languageNotes = {
      en: '',
      tw: '\n\nTwi language notes: "kɔma" = to, "sika" = money, "fa" = send',
      ha: '\n\nHausa language notes: "aika" = send, "zuwa" = to, "kudi" = money',
      ig: '\n\nIgbo language notes: "zipu" = send, "ego" = money, "na" = to',
      yo: '\n\nYoruba language notes: "fi ranṣẹ" = send, "owo" = money, "si" = to',
    };

    return basePrompt + (languageNotes[language as keyof typeof languageNotes] || '');
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(transcript: string, language: string): string {
    let prompt = `Parse this ${language.toUpperCase()} voice command for payment intent:\n\n"${transcript}"\n\n`;

    if (this.context.previousRecipient) {
      prompt += `Context from previous command:\n`;
      prompt += `- Previous recipient: ${this.context.previousRecipient}\n`;
      prompt += `- Previous amount: ${this.context.previousAmount} ${this.context.previousCurrency}\n\n`;
    }

    prompt += `Extract the payment information and respond with JSON only.`;

    return prompt;
  }

  /**
   * Fallback parsing using regex (when OpenAI API unavailable)
   */
  private fallbackParsing(transcript: string, language: string): PaymentIntent {
    const normalized = transcript.toLowerCase();

    // Extract amount
    const amountMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(cedis|usdc|dollars?|eth|ghs|ngn|kes|usd)/i);
    const amount = amountMatch ? amountMatch[1] : '0';
    let currency = amountMatch ? amountMatch[2].toLowerCase() : 'usdc';

    // Normalize currency
    if (currency === 'cedis') currency = 'ghs';
    if (currency === 'dollar' || currency === 'dollars') currency = 'usd';

    // Extract recipient
    const recipientMatch = normalized.match(/to\s+([a-z0-9.-]+\.(?:eth|base\.eth))/i);
    const recipient = recipientMatch ? recipientMatch[1] : '';

    // Determine action
    let action: PaymentIntent['action'] = 'send_money';
    if (normalized.includes('balance') || normalized.includes('how much')) {
      action = 'check_balance';
    } else if (normalized.includes('history') || normalized.includes('transactions')) {
      action = 'transaction_history';
    } else if (normalized.includes('split') || normalized.includes('between')) {
      action = 'split_payment';
    }

    return {
      action,
      amount,
      currency,
      recipient,
      confidence: recipient ? 0.7 : 0.4,
      language,
      rawTranscript: transcript,
      clarificationNeeded: !recipient && action === 'send_money',
      clarificationQuestion: !recipient ? 'Who would you like to send the payment to?' : undefined,
    };
  }

  /**
   * Get conversation context
   */
  getContext(): ConversationContext {
    return { ...this.context };
  }

  /**
   * Clear conversation context
   */
  clearContext(): void {
    this.context = {
      conversationHistory: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Set context (useful for resuming conversations)
   */
  setContext(context: ConversationContext): void {
    this.context = context;
  }

  /**
   * Get command suggestions based on history and common patterns
   */
  getSuggestions(partialCommand: string): string[] {
    const suggestions = [
      'Send 50 USDC to mama.base.eth',
      'Send 100 cedis to friend.eth',
      'Check my balance',
      'Show transaction history',
      'Split 200 USDC between alice.eth and bob.eth',
    ];

    // If there's a previous recipient, suggest sending to them again
    if (this.context.previousRecipient) {
      suggestions.unshift(`Send to ${this.context.previousRecipient} again`);
    }

    return suggestions.filter(s => s.toLowerCase().includes(partialCommand.toLowerCase()));
  }

  /**
   * Correct common voice recognition errors
   */
  correctTranscript(transcript: string): string {
    const corrections: Record<string, string> = {
      'you sdc': 'USDC',
      'you as dc': 'USDC',
      'ethereum': 'ETH',
      'send money': 'send',
      'transfer': 'send',
      'pay': 'send',
      // Add more common misrecognitions
    };

    let corrected = transcript;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, right);
    });

    return corrected;
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
