/**
 * OpenAI Service for Voice Command Intent Extraction
 *
 * Uses GPT-4 to parse natural language voice commands and extract
 * payment intents and entities with high accuracy
 */

import OpenAI from "openai";
import type {
  IntentExtractionResponse,
  PaymentIntent,
  ExtractedEntities,
  UserContext,
  OpenAIConfig,
} from "~~/types/nlp";

class OpenAIService {
  private client: OpenAI | null = null;
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      maxTokens: 500,
    };

    if (this.config.apiKey) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true, // For client-side usage
      });
    }
  }

  /**
   * Check if OpenAI service is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.config.apiKey !== "";
  }

  /**
   * Extract intent and entities from voice command
   */
  async extractIntent(
    voiceText: string,
    userContext?: UserContext,
  ): Promise<IntentExtractionResponse> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(voiceText, userContext);

    try {
      const response = await this.client!.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsed = JSON.parse(content) as IntentExtractionResponse;
      return this.validateAndNormalizeResponse(parsed);
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      throw new Error(`Intent extraction failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt for GPT-4
   */
  private buildSystemPrompt(): string {
    return `You are an expert voice command parser for a crypto payment application used in Africa.
Your task is to extract payment intents and entities from natural language voice commands.

SUPPORTED INTENTS:
- send_money: User wants to send cryptocurrency to someone
- check_balance: User wants to check their wallet balance
- split_payment: User wants to split payment among multiple people
- recurring_payment: User wants to set up recurring payments
- cancel_recurring: User wants to cancel a recurring payment
- view_history: User wants to see transaction history
- request_money: User wants to request payment from someone
- unknown: Cannot determine intent clearly

SUPPORTED LANGUAGES:
English, Twi, Hausa, Yoruba, Igbo, Ga, Nigerian Pidgin, French, Swahili
Handle code-switching (mixing languages) gracefully.

ENTITIES TO EXTRACT:
- amount: Numerical value (e.g., "50", "hundred", "one thousand")
- recipient: Wallet address or ENS name (e.g., "john.eth", "0x1234...", "my mom")
- currency: USD, USDC, ETH, cedis, naira, etc.
- frequency: For recurring payments (daily, weekly, monthly)
- splits: For split payments (array of recipients and amounts/percentages)
- reference: Payment reference or note

CONTEXTUAL UNDERSTANDING:
- "last time" = use recent recipient from context
- "same person" = use most recent recipient
- "my mom", "dad", "brother" = resolve from context if available
- Pronouns (he, she, they) = refer to context

RESPONSE FORMAT (JSON):
{
  "intent": "send_money",
  "entities": {
    "amount": "50",
    "recipient": "john.eth",
    "currency": "USDC"
  },
  "confidence": 0.95,
  "clarificationNeeded": false,
  "clarificationQuestion": null,
  "reasoning": "Clear send money command with all required entities"
}

If information is missing or ambiguous, set clarificationNeeded=true and provide a clarificationQuestion.
Always provide confidence score (0.0 to 1.0).`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(voiceText: string, userContext?: UserContext): string {
    let prompt = `Parse this voice command: "${voiceText}"\n\n`;

    if (userContext) {
      // Add recent recipients to context
      if (userContext.recentRecipients.length > 0) {
        prompt += "RECENT RECIPIENTS:\n";
        userContext.recentRecipients.slice(0, 3).forEach((r, i) => {
          prompt += `${i + 1}. ${r.name || "Unknown"} (${r.address})\n`;
        });
        prompt += "\n";
      }

      // Add recent amounts for reference
      if (userContext.recentAmounts.length > 0) {
        const lastAmount = userContext.recentAmounts[0];
        prompt += `RECENT AMOUNT: ${lastAmount.amount} ${lastAmount.currency}\n\n`;
      }

      // Add preferred currency
      if (userContext.preferredCurrency) {
        prompt += `PREFERRED CURRENCY: ${userContext.preferredCurrency}\n\n`;
      }
    }

    prompt += "Extract the intent and entities as JSON.";
    return prompt;
  }

  /**
   * Validate and normalize the response from GPT-4
   */
  private validateAndNormalizeResponse(response: IntentExtractionResponse): IntentExtractionResponse {
    // Ensure intent is valid
    const validIntents: PaymentIntent[] = [
      "send_money",
      "check_balance",
      "split_payment",
      "recurring_payment",
      "cancel_recurring",
      "view_history",
      "request_money",
      "unknown",
    ];

    if (!validIntents.includes(response.intent)) {
      response.intent = "unknown";
    }

    // Ensure confidence is between 0 and 1
    response.confidence = Math.max(0, Math.min(1, response.confidence || 0));

    // Normalize entities
    response.entities = this.normalizeEntities(response.entities);

    return response;
  }

  /**
   * Normalize extracted entities
   */
  private normalizeEntities(entities: ExtractedEntities): ExtractedEntities {
    const normalized: ExtractedEntities = { ...entities };

    // Normalize amount (remove commas, convert words to numbers)
    if (normalized.amount) {
      normalized.amount = this.normalizeAmount(normalized.amount);
    }

    // Normalize currency
    if (normalized.currency) {
      normalized.currency = this.normalizeCurrency(normalized.currency);
    }

    // Normalize recipient (lowercase ENS names)
    if (normalized.recipient && normalized.recipient.includes(".eth")) {
      normalized.recipient = normalized.recipient.toLowerCase();
    }

    return normalized;
  }

  /**
   * Normalize amount strings
   */
  private normalizeAmount(amount: string): string {
    // Remove commas
    amount = amount.replace(/,/g, "");

    // Convert common words to numbers
    const wordToNumber: Record<string, string> = {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      ten: "10",
      twenty: "20",
      fifty: "50",
      hundred: "100",
      thousand: "1000",
    };

    const lowerAmount = amount.toLowerCase();
    for (const [word, num] of Object.entries(wordToNumber)) {
      if (lowerAmount === word) {
        return num;
      }
    }

    return amount;
  }

  /**
   * Normalize currency names
   */
  private normalizeCurrency(currency: string): string {
    const currencyMap: Record<string, string> = {
      usdc: "USDC",
      usd: "USDC",
      dollar: "USDC",
      dollars: "USDC",
      eth: "ETH",
      ethereum: "ETH",
      ether: "ETH",
      cedi: "GHS",
      cedis: "GHS",
      naira: "NGN",
      // Add more currency mappings
    };

    const normalized = currencyMap[currency.toLowerCase()];
    return normalized || currency.toUpperCase();
  }

  /**
   * Generate suggestions based on partial input
   */
  async generateSuggestions(partialInput: string, userContext?: UserContext): Promise<string[]> {
    if (!this.isAvailable() || !partialInput || partialInput.length < 3) {
      return [];
    }

    try {
      const systemPrompt = `Generate 3 command completion suggestions for a crypto payment app.
Keep suggestions concise and actionable.`;

      const userPrompt = `Partial input: "${partialInput}"
${userContext?.recentRecipients.length ? `Recent recipient: ${userContext.recentRecipients[0].name || userContext.recentRecipients[0].address}` : ""}

Provide 3 command completions as JSON array of strings.`;

      const response = await this.client!.chat.completions.create({
        model: "gpt-3.5-turbo", // Use faster model for suggestions
        temperature: 0.7,
        max_tokens: 150,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      return parsed.suggestions || [];
    } catch (error) {
      console.error("Suggestion generation error:", error);
      return [];
    }
  }
}

export const openAIService = new OpenAIService();
