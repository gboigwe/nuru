/**
 * AI Prompt Templates for Voice Command Processing
 *
 * Specialized prompts for different languages and command types
 */

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  tw: 'Twi (Akan)',
  ha: 'Hausa',
  ig: 'Igbo',
  yo: 'Yoruba',
  fr: 'French',
  sw: 'Swahili',
};

export const LANGUAGE_VOCABULARY = {
  tw: {
    send: ['fa', 'kɔma', 'de kɔ'],
    money: ['sika', 'sika nketenkete'],
    to: ['kɔma', 'ma'],
    from: ['fi'],
    cedis: ['sidi', 'ghana sika'],
  },
  ha: {
    send: ['aika', 'tura'],
    money: ['kudi', 'kuɗi'],
    to: ['zuwa', 'ga'],
    from: ['daga'],
  },
  ig: {
    send: ['zipu', 'ziga'],
    money: ['ego'],
    to: ['na', 'nye'],
    from: ['si'],
  },
  yo: {
    send: ['fi ranṣẹ', 'rán', 'fi'],
    money: ['owo'],
    to: ['si', 'fun'],
    from: ['lati'],
  },
};

export const EXAMPLE_COMMANDS: Record<string, string[]> = {
  en: [
    'Send 50 USDC to mama.base.eth',
    'Transfer 100 cedis to friend.eth',
    'Pay papa.eth 25 dollars',
    'Split 200 USDC between alice.eth and bob.eth',
    'Send the same amount to the same person',
    'Check my balance',
    'Show transaction history',
  ],
  tw: [
    'Fa sika aduonum kɔma mama.base.eth',
    'De sika ɔha kɔma adamfo.eth',
    'Fa sika aduonu anum ma papa.eth',
  ],
  ha: [
    'Aika kudi hamsin zuwa mama.base.eth',
    'Tura kudi ɗari zuwa aboki.eth',
    'Aika kudi ashirin da biyar ga papa.eth',
  ],
  ig: [
    'Zipu ego iri ise na mama.base.eth',
    'Ziga ego otu narị nye enyi.eth',
    'Nye papa.eth ego iri abụọ na ise',
  ],
  yo: [
    'Fi owo aadota ranṣẹ si mama.base.eth',
    'Rán owo ọgọrun si ọrẹ.eth',
    'Fi owo mẹẹdọgbọn fun papa.eth',
  ],
};

export const CLARIFICATION_PROMPTS: Record<string, Record<string, string>> = {
  missingRecipient: {
    en: 'Who would you like to send the payment to?',
    tw: 'Hwan na wobɛkɔma no sika no?',
    ha: 'Wa zaka aika kuɗin?',
    ig: 'Onye ka ịchọrọ iziga ego ahụ?',
    yo: 'Ta ni o fẹ fi owo naa ranṣẹ sí?',
  },
  missingAmount: {
    en: 'How much would you like to send?',
    tw: 'Sika dodow bɛn na wobɛkɔma?',
    ha: 'Nawa zaka aika?',
    ig: 'Ego ole ka ịchọrọ iziga?',
    yo: 'Elo ni o fẹ fi ranṣẹ?',
  },
  confirmSplit: {
    en: 'You want to split {amount} {currency} between {recipients}. Is that correct?',
    tw: 'Wopɛ sɛ wokyɛ {amount} {currency} mu wɔ {recipients} ntam. Ɛyɛ nokware?',
    ha: 'Kuna son raba {amount} {currency} tsakanin {recipients}. Daidai ne?',
    ig: 'Ịchọrọ ịkesa {amount} {currency} n'etiti {recipients}. Ọ bụ eziokwu?',
    yo: 'O fẹ pin {amount} {currency} laarin {recipients}. Ṣe o tọ?',
  },
};

export const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  invalidCommand: {
    en: 'I couldn\'t understand that command. Try saying "Send 50 USDC to mama.base.eth"',
    tw: 'Mentee asɛm no ase. Sɛ ka sɛ "Fa sika aduonum kɔma mama.base.eth"',
    ha: 'Ban fahimci wannan umarni ba. Gwada cewa "Aika USDC hamsin zuwa mama.base.eth"',
    ig: 'Aghọtaghị m iwu ahụ. Gbalịa ịsị "Zipu USDC iri ise na mama.base.eth"',
    yo: 'Emi ko mọ aṣẹ yẹn. Gbiyanju sọ "Fi USDC aadota ranṣẹ si mama.base.eth"',
  },
  networkError: {
    en: 'Network error. Please try again.',
    tw: 'Network haw. Yɛ sre san bio.',
    ha: 'Matsalar hanyar sadarwa. Don Allah sake gwadawa.',
    ig: 'Nsogbu netwọk. Biko nwaakwa.',
    yo: 'Aṣiṣe nẹtiwọọki. Jọwọ gbiyanju lẹẹkansi.',
  },
  insufficientBalance: {
    en: 'Insufficient balance. You have {balance} {currency}',
    tw: 'Wo sika nti hia. Wowɔ {balance} {currency}',
    ha: 'Kudi bai isa ba. Kuna da {balance} {currency}',
    ig: 'Ego ezughị ezu. Ị nwere {balance} {currency}',
    yo: 'Owo ko to. O ni {balance} {currency}',
  },
};

export const COMMAND_SUGGESTIONS: Record<string, string[]> = {
  payment: [
    'Send [amount] [currency] to [recipient]',
    'Pay [recipient] [amount] [currency]',
    'Transfer [amount] to [recipient]',
    'Split [amount] between [recipient1] and [recipient2]',
  ],
  query: [
    'Check my balance',
    'Show transaction history',
    'How much USDC do I have?',
    'What\'s my last transaction?',
  ],
  followUp: [
    'Send the same to [another person]',
    'Double that amount',
    'Send to the same person',
    'Cancel that',
  ],
};

/**
 * Build a contextual system prompt for GPT-4
 */
export function buildSystemPrompt(options: {
  language?: string;
  includeExamples?: boolean;
  previousContext?: string;
}): string {
  const { language = 'en', includeExamples = true, previousContext } = options;

  const languageName = LANGUAGE_NAMES[language] || 'English';
  const vocab = LANGUAGE_VOCABULARY[language as keyof typeof LANGUAGE_VOCABULARY];

  let prompt = `You are Nuru's voice payment assistant, specialized in processing ${languageName} voice commands for cryptocurrency payments on BASE blockchain.

**Your Role:**
1. Parse natural language payment commands
2. Extract structured payment information
3. Handle ambiguity gracefully
4. Provide helpful clarifications
5. Remember context from previous commands

**Supported Actions:**
- send_money: Transfer funds to a recipient
- split_payment: Split an amount between multiple recipients
- check_balance: Query user's balance
- transaction_history: Show past transactions

**Supported Currencies:**
- USDC (primary), ETH, USD
- GHS (Ghana Cedis), NGN (Naira), KES (Shilling)

**Recipient Formats:**
- ENS: name.eth
- Basename: name.base.eth
- Ethereum address: 0x...

**Context Awareness:**
You remember previous commands in the conversation. Handle references like:
- "send the same amount" (use previous amount)
- "to the same person" (use previous recipient)
- "double that" (multiply previous amount by 2)
- "cancel" (abort current action)`;

  if (vocab) {
    prompt += `\n\n**${languageName} Vocabulary:**\n`;
    prompt += `- Send: ${vocab.send?.join(', ')}\n`;
    prompt += `- Money: ${vocab.money?.join(', ')}\n`;
    prompt += `- To: ${vocab.to?.join(', ')}\n`;
  }

  if (includeExamples && EXAMPLE_COMMANDS[language]) {
    prompt += `\n\n**Example Commands:**\n`;
    EXAMPLE_COMMANDS[language].forEach((example, i) => {
      prompt += `${i + 1}. "${example}"\n`;
    });
  }

  if (previousContext) {
    prompt += `\n\n**Previous Context:**\n${previousContext}`;
  }

  prompt += `\n\n**Output Format (JSON):**
{
  "action": "send_money|split_payment|check_balance|transaction_history",
  "amount": "string (number only)",
  "currency": "usdc|eth|ghs|ngn|kes|usd",
  "recipient": "string (ENS/Basename/address)",
  "recipients": [{"address": "...", "amount": "..."}],
  "confidence": 0.0-1.0,
  "clarificationNeeded": boolean,
  "clarificationQuestion": "string if needed"
}

Respond with JSON only.`;

  return prompt;
}

/**
 * Format clarification question in user's language
 */
export function getClarificationQuestion(
  type: keyof typeof CLARIFICATION_PROMPTS,
  language: string,
  params?: Record<string, string>,
): string {
  let question = CLARIFICATION_PROMPTS[type][language] || CLARIFICATION_PROMPTS[type]['en'];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      question = question.replace(`{${key}}`, value);
    });
  }

  return question;
}

/**
 * Get error message in user's language
 */
export function getErrorMessage(
  type: keyof typeof ERROR_MESSAGES,
  language: string,
  params?: Record<string, string>,
): string {
  let message = ERROR_MESSAGES[type][language] || ERROR_MESSAGES[type]['en'];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }

  return message;
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(category: keyof typeof COMMAND_SUGGESTIONS): string[] {
  return COMMAND_SUGGESTIONS[category] || [];
}
