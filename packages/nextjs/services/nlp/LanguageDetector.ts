/**
 * Language Detector Service
 *
 * Detects language from voice commands with support for African languages
 * and code-switching (mixing multiple languages)
 */

import type { LanguageDetection, SupportedLanguage, LanguageTerms } from "~~/types/nlp";

class LanguageDetectorService {
  private languagePatterns: Map<SupportedLanguage, RegExp[]>;
  private languageTerms: Record<SupportedLanguage, LanguageTerms>;

  constructor() {
    this.languagePatterns = this.initializeLanguagePatterns();
    this.languageTerms = this.initializeLanguageTerms();
  }

  /**
   * Detect language from voice text
   */
  detectLanguage(text: string): LanguageDetection {
    const normalizedText = text.toLowerCase();
    const detections: Array<{ language: SupportedLanguage; score: number }> = [];

    // Check each language pattern
    for (const [language, patterns] of this.languagePatterns.entries()) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          score++;
        }
      }
      if (score > 0) {
        detections.push({ language, score });
      }
    }

    // Sort by score
    detections.sort((a, b) => b.score - a.score);

    // Determine if code-switched
    const isCodeSwitched = detections.length > 1;
    const primaryLanguage = detections[0]?.language || "en";
    const confidence = detections[0] ? Math.min(0.95, detections[0].score / 5) : 0.5;

    return {
      language: primaryLanguage,
      confidence,
      isCodeSwitched,
      detectedLanguages: detections.map(d => d.language),
    };
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(key: string, language: SupportedLanguage): string {
    const messages: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        insufficient_balance: "Insufficient balance for this transaction",
        invalid_address: "Invalid wallet address or ENS name",
        missing_amount: "Please specify the amount to send",
        missing_recipient: "Please specify the recipient",
        transaction_success: "Transaction successful",
        transaction_failed: "Transaction failed",
      },
      tw: {
        insufficient_balance: "Sika a ɛwɔ hɔ no sua koraa",
        invalid_address: "Wallet address no nyɛ papa",
        missing_amount: "Yɛsrɛ wo kyerɛ sika dodoɔ",
        missing_recipient: "Yɛsrɛ wo kyerɛ deɛ wobɛma no",
        transaction_success: "Dwumadie no kɔɔ so yie",
        transaction_failed: "Dwumadie no ankɔ so",
      },
      ha: {
        insufficient_balance: "Kuɗin da kake da shi bai isa ba",
        invalid_address: "Adireshin walat ɗin ba daidai ba ne",
        missing_amount: "Don Allah faɗa adadin kuɗin",
        missing_recipient: "Don Allah faɗa wanda zaka aika",
        transaction_success: "An yi nasarar aika",
        transaction_failed: "Aikawa ya gaza",
      },
      yo: {
        insufficient_balance: "Owo ti o wa ninu apamọwọ ko to",
        invalid_address: "Adiresi apamọwọ ko tọ",
        missing_amount: "Jọwọ sọ iye owo ti o fẹ fi ranṣẹ",
        missing_recipient: "Jọwọ sọ ẹni ti o fẹ fi ranṣẹ si",
        transaction_success: "O ṣaṣeyọri",
        transaction_failed: "Ko ṣaṣeyọri",
      },
      ig: {
        insufficient_balance: "Ego dị na ego gị ezughi",
        invalid_address: "Adreesị wallet adịghị mma",
        missing_amount: "Biko kwuo ego ị ga-eziga",
        missing_recipient: "Biko kwuo onye ị ga-eziga",
        transaction_success: "Ọ gara nke ọma",
        transaction_failed: "Ọ gara nke ọjọọ",
      },
      ga: {
        insufficient_balance: "Sika lɛ bɔɔbɔɔ ni",
        invalid_address: "Wallet address lɛ ko yɔɔ",
        missing_amount: "Yɛkɛ sika lɛ",
        missing_recipient: "Yɛkɛ mɔni lɛ ba sɔmi",
        transaction_success: "E yaa",
        transaction_failed: "E ko yaa",
      },
      pcm: {
        insufficient_balance: "Money wey dey your account no reach",
        invalid_address: "The wallet address no correct",
        missing_amount: "Abeg talk how much you wan send",
        missing_recipient: "Abeg talk who you wan send give",
        transaction_success: "E don work",
        transaction_failed: "E no work",
      },
      fr: {
        insufficient_balance: "Solde insuffisant",
        invalid_address: "Adresse de portefeuille invalide",
        missing_amount: "Veuillez spécifier le montant",
        missing_recipient: "Veuillez spécifier le destinataire",
        transaction_success: "Transaction réussie",
        transaction_failed: "Transaction échouée",
      },
      sw: {
        insufficient_balance: "Salio haitoshi",
        invalid_address: "Anwani ya pochi si sahihi",
        missing_amount: "Tafadhali taja kiasi",
        missing_recipient: "Tafadhali taja mpokeaji",
        transaction_success: "Umefanikiwa",
        transaction_failed: "Imeshindwa",
      },
    };

    return messages[language]?.[key] || messages.en[key] || key;
  }

  /**
   * Initialize language detection patterns
   */
  private initializeLanguagePatterns(): Map<SupportedLanguage, RegExp[]> {
    return new Map([
      [
        "en",
        [
          /\b(send|transfer|pay|give)\b/,
          /\b(money|cash|funds|payment)\b/,
          /\b(to|from|for)\b/,
          /\b(check|balance|wallet)\b/,
        ],
      ],
      [
        "tw",
        [
          /\b(soma|tua|ma|fa)\b/, // send, pay, give
          /\b(sika|kudi)\b/, // money
          /\b(kyɛ|kyerɛ)\b/, // to, show
          /\b(akonta|wallet)\b/, // account, wallet
        ],
      ],
      [
        "ha",
        [
          /\b(aika|tura|biya)\b/, // send, pay
          /\b(kuɗi|kudi)\b/, // money
          /\b(zuwa|ga)\b/, // to
          /\b(asusun|wallet)\b/, // account
        ],
      ],
      [
        "yo",
        [
          /\b(fi|ranṣẹ|sanwo)\b/, // send, pay
          /\b(owo|owo)\b/, // money
          /\b(si|fun)\b/, // to, for
          /\b(apamọwọ|wallet)\b/, // wallet
        ],
      ],
      [
        "ig",
        [
          /\b(ziga|nye|kwụọ)\b/, // send, give, pay
          /\b(ego|mari)\b/, // money
          /\b(nye|ga)\b/, // to, for
          /\b(akaụntụ|wallet)\b/, // account
        ],
      ],
      [
        "ga",
        [
          /\b(sɔmi|fa|tua)\b/, // send, give, pay
          /\b(sika|kudi)\b/, // money
          /\b(ni|he)\b/, // to
        ],
      ],
      [
        "pcm",
        [
          /\b(send|give|pay)\b/,
          /\b(money|cash)\b/,
          /\b(abeg|make)\b/, // please, make
          /\b(wallet|account)\b/,
        ],
      ],
      [
        "fr",
        [
          /\b(envoyer|transférer|payer)\b/, // send, transfer, pay
          /\b(argent|fonds)\b/, // money, funds
          /\b(à|pour)\b/, // to, for
          /\b(portefeuille|compte)\b/, // wallet, account
        ],
      ],
      [
        "sw",
        [
          /\b(tuma|lipa|pa)\b/, // send, pay, give
          /\b(pesa|fedha)\b/, // money
          /\b(kwa|kwenda)\b/, // to, for
          /\b(pochi|akaunti)\b/, // wallet, account
        ],
      ],
    ]);
  }

  /**
   * Initialize language-specific terms
   */
  private initializeLanguageTerms(): Record<SupportedLanguage, LanguageTerms> {
    return {
      en: {
        sendMoney: ["send", "transfer", "pay", "give"],
        checkBalance: ["check", "balance", "wallet"],
        splitPayment: ["split", "divide", "share"],
        currencies: {
          USDC: ["usdc", "dollar", "dollars", "usd"],
          ETH: ["eth", "ethereum", "ether"],
          GHS: ["cedis", "cedi", "ghana"],
          NGN: ["naira", "nigeria"],
        },
      },
      tw: {
        sendMoney: ["soma", "tua", "ma", "fa"],
        checkBalance: ["hwɛ", "kyerɛ", "akonta"],
        splitPayment: ["kyɛ", "bɔ"],
        currencies: {
          USDC: ["dollar"],
          ETH: ["ethereum"],
          GHS: ["sidi", "cedis", "ghana sika"],
        },
      },
      ha: {
        sendMoney: ["aika", "tura", "biya"],
        checkBalance: ["duba", "lissafi"],
        splitPayment: ["raba", "raraba"],
        currencies: {
          USDC: ["dollar"],
          NGN: ["naira"],
        },
      },
      yo: {
        sendMoney: ["fi", "ranṣẹ", "sanwo"],
        checkBalance: ["wo", "ṣayẹwo"],
        splitPayment: ["pin", "pin sí"],
        currencies: {
          USDC: ["dola"],
          NGN: ["naira"],
        },
      },
      ig: {
        sendMoney: ["ziga", "nye", "kwụọ"],
        checkBalance: ["lee", "chọpụta"],
        splitPayment: ["kee", "kewaa"],
        currencies: {
          USDC: ["dola"],
          NGN: ["naira"],
        },
      },
      ga: {
        sendMoney: ["sɔmi", "fa", "tua"],
        checkBalance: ["hwɛ", "lɛ"],
        splitPayment: ["kyɛ"],
        currencies: {
          GHS: ["sidi", "ghana sika"],
        },
      },
      pcm: {
        sendMoney: ["send", "give", "pay"],
        checkBalance: ["check", "see"],
        splitPayment: ["share", "divide"],
        currencies: {
          USDC: ["dollar"],
          NGN: ["naira"],
        },
      },
      fr: {
        sendMoney: ["envoyer", "transférer", "payer"],
        checkBalance: ["vérifier", "solde"],
        splitPayment: ["partager", "diviser"],
        currencies: {
          USDC: ["dollar"],
        },
      },
      sw: {
        sendMoney: ["tuma", "lipa", "pa"],
        checkBalance: ["angalia", "salio"],
        splitPayment: ["gawanya", "sambaza"],
        currencies: {
          USDC: ["dola"],
        },
      },
    };
  }

  /**
   * Get action terms for a specific language
   */
  getActionTerms(language: SupportedLanguage, action: keyof LanguageTerms): string[] {
    return this.languageTerms[language]?.[action] || this.languageTerms.en[action] || [];
  }

  /**
   * Get currency terms for a specific language
   */
  getCurrencyTerms(language: SupportedLanguage): Record<string, string[]> {
    return this.languageTerms[language]?.currencies || this.languageTerms.en.currencies;
  }
}

export const languageDetector = new LanguageDetectorService();
