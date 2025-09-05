import { ensService, ENSService, ENSResolutionResult } from './ens/ENSService';
import { voiceCommandProcessor, VoiceCommandProcessor, PaymentIntent } from './voice/VoiceCommandProcessor';

/**
 * Main VoicePay Service that combines voice processing with ENS resolution
 */
export interface ProcessedVoiceCommand {
  intent: PaymentIntent;
  ensResolution?: ENSResolutionResult;
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export interface VoiceToPaymentResult {
  success: boolean;
  data?: ProcessedVoiceCommand;
  error?: string;
  confidence: number;
}

export class VoicePayService {
  constructor(
    private ensService: ENSService,
    private voiceProcessor: VoiceCommandProcessor
  ) {}

  /**
   * Process voice command for payment execution
   */
  async processVoiceCommand(audioTranscript: string): Promise<VoiceToPaymentResult> {
    try {
      // Step 1: Extract payment intent from voice
      const intent = await this.voiceProcessor.extractPaymentIntent(audioTranscript);
      
      if (!intent) {
        const suggestions = this.voiceProcessor.getSuggestedCommands(audioTranscript);
        return {
          success: false,
          error: 'Could not understand voice command. Please try again.',
          confidence: 0,
          data: {
            intent: {} as PaymentIntent,
            isValid: false,
            errors: ['Voice command not recognized'],
            suggestions
          }
        };
      }

      // Step 2: Validate voice command
      const validation = this.voiceProcessor.validateVoiceCommand(intent);
      
      // Step 3: Resolve ENS if needed
      let ensResolution: ENSResolutionResult | undefined;
      if (intent.action === 'send_money' && intent.recipient) {
        if (intent.recipient.endsWith('.eth')) {
          ensResolution = await this.ensService.resolveENSToAddress(intent.recipient);
          
          // Add ENS validation errors
          if (!ensResolution.address) {
            validation.errors.push(`ENS name "${intent.recipient}" could not be resolved`);
          }
        }
      }

      // Step 4: Get suggestions for improvement
      const suggestions = validation.errors.length > 0 
        ? this.voiceProcessor.getSuggestedCommands(audioTranscript)
        : [];

      const processedCommand: ProcessedVoiceCommand = {
        intent,
        ensResolution,
        isValid: validation.isValid,
        errors: validation.errors,
        suggestions
      };

      return {
        success: validation.isValid,
        data: processedCommand,
        confidence: intent.confidence,
        error: validation.errors.length > 0 ? validation.errors[0] : undefined
      };

    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      };
    }
  }

  /**
   * Extract and resolve multiple ENS names from voice transcript
   */
  async extractAndResolveENS(transcript: string): Promise<Map<string, string | null>> {
    const ensNames = this.ensService.extractENSFromVoiceCommand(transcript);
    if (ensNames.length === 0) {
      return new Map();
    }

    return await this.ensService.batchResolveENS(ensNames);
  }

  /**
   * Validate payment parameters before execution
   */
  async validatePaymentParameters(intent: PaymentIntent): Promise<{
    isValid: boolean;
    errors: string[];
    resolvedAddress?: string;
  }> {
    const errors: string[] = [];
    let resolvedAddress: string | undefined;

    // Basic intent validation
    const basicValidation = this.voiceProcessor.validateVoiceCommand(intent);
    errors.push(...basicValidation.errors);

    // ENS resolution validation
    if (intent.recipient && intent.recipient.endsWith('.eth')) {
      const ensResult = await this.ensService.resolveENSToAddress(intent.recipient);
      if (!ensResult.address) {
        errors.push(`Cannot resolve ENS name: ${intent.recipient}`);
      } else {
        resolvedAddress = ensResult.address;
        
        // Check if ENS name actually exists (has resolver)
        const exists = await this.ensService.ensExists(intent.recipient);
        if (!exists) {
          errors.push(`ENS name ${intent.recipient} does not exist`);
        }
      }
    }

    // Amount validation for specific currencies
    if (intent.action === 'send_money') {
      const amount = parseFloat(intent.amount);
      
      // Currency-specific limits
      const limits = {
        cedis: { min: 1, max: 50000 },      // GHS 1 - 50,000
        dollars: { min: 0.1, max: 10000 },  // $0.1 - $10,000
        usdc: { min: 0.1, max: 10000 },     // 0.1 - 10,000 USDC
        eth: { min: 0.001, max: 100 }       // 0.001 - 100 ETH
      };

      const limit = limits[intent.currency];
      if (limit) {
        if (amount < limit.min) {
          errors.push(`Amount too small. Minimum: ${limit.min} ${intent.currency.toUpperCase()}`);
        }
        if (amount > limit.max) {
          errors.push(`Amount too large. Maximum: ${limit.max} ${intent.currency.toUpperCase()}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      resolvedAddress
    };
  }

  /**
   * Get payment summary for user confirmation
   */
  generatePaymentSummary(processedCommand: ProcessedVoiceCommand): {
    summary: string;
    details: {
      action: string;
      amount: string;
      currency: string;
      recipient: string;
      recipientAddress?: string;
      confidence: number;
    };
  } {
    const { intent, ensResolution } = processedCommand;
    
    let summary = '';
    let recipientAddress: string | undefined;

    if (intent.action === 'send_money') {
      summary = `Send ${intent.amount} ${intent.currency.toUpperCase()} to ${intent.recipient}`;
      recipientAddress = ensResolution?.address || undefined;
      
      if (recipientAddress) {
        summary += ` (${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)})`;
      }
    } else if (intent.action === 'check_balance') {
      summary = 'Check account balance';
    } else if (intent.action === 'transaction_history') {
      summary = 'Show transaction history';
    }

    return {
      summary,
      details: {
        action: intent.action,
        amount: intent.amount,
        currency: intent.currency,
        recipient: intent.recipient,
        recipientAddress,
        confidence: intent.confidence
      }
    };
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(error: string, language: 'en' | 'tw' | 'ha' = 'en'): string {
    const messages = {
      en: {
        'Voice command not recognized': 'I couldn\'t understand that. Please try saying "Send 50 cedis to mama.family.eth"',
        'Invalid amount specified': 'Please specify a valid amount, like "50" or "one hundred"',
        'Invalid recipient format': 'Please use an ENS name like "name.eth" or a valid address',
        'ENS name could not be resolved': 'That ENS name doesn\'t exist. Please check the spelling.',
        'Amount too small': 'The amount is too small. Please send at least the minimum amount.',
        'Amount too large': 'The amount is too large. Please reduce the amount.',
        'Unsupported currency': 'Please use cedis, dollars, USDC, or ETH'
      },
      tw: {
        'Voice command not recognized': 'Mantee wo asɛm no. Sɛ ka sɛ "Fa cedis aduonum kɔma mama.family.eth"',
        'Invalid amount specified': 'Ka sika dodow a ɛfata, te sɛ "aduonum" anaasɛ "ɔha baako"',
        'Invalid recipient format': 'Fa ENS din a ɛte sɛ "din.eth" anaasɛ address a ɛyɛ nokware',
        'ENS name could not be resolved': 'Saa ENS din no nni hɔ. Hwɛ kyerɛwsɛm no mu.',
        'Amount too small': 'Sika no sua. Fa bɛboro no.',
        'Amount too large': 'Sika no dɔɔso. Te so kakra.',
        'Unsupported currency': 'Fa cedis, dollars, USDC, anaasɛ ETH'
      },
      ha: {
        'Voice command not recognized': 'Ban fahimta ba. Ka misali "Aika cedis hamsin zuwa mama.family.eth"',
        'Invalid amount specified': 'Ka adadin kuɗi daidai, kamar "hamsin" ko "ɗari ɗaya"',
        'Invalid recipient format': 'Yi amfani da sunan ENS kamar "suna.eth" ko adireshin da ya dace',
        'ENS name could not be resolved': 'Wannan sunan ENS babu shi. Duba rubutun.',
        'Amount too small': 'Kuɗin ya yi ƙanƙanta. Ƙara shi.',
        'Amount too large': 'Kuɗin ya yi yawa. Rage shi.',
        'Unsupported currency': 'Yi amfani da cedis, dollars, USDC, ko ETH'
      }
    };

    return messages[language][error as keyof typeof messages[typeof language]] || error;
  }

  /**
   * Clear caches and cleanup
   */
  cleanup(): void {
    this.ensService.clearExpiredCache();
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ens: this.ensService.getCacheStats(),
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const voicePayService = new VoicePayService(ensService, voiceCommandProcessor);