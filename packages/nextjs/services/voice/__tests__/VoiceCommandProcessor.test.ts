import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voiceCommandProcessor, PaymentIntent } from '../VoiceCommandProcessor';

// Mock OpenAI service
vi.mock('../../ai/OpenAIService', () => ({
  openAIService: {
    extractPaymentIntent: vi.fn(),
    getContext: vi.fn(),
    clearContext: vi.fn(),
    setContext: vi.fn(),
  },
}));

describe('VoiceCommandProcessor', () => {
  describe('extractPaymentIntent', () => {
    it('should parse "send 50 cedis to mama.family.eth"', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'send 50 cedis to mama.family.eth'
      );

      expect(result).toBeDefined();
      expect(result?.action).toBe('send_money');
      expect(result?.amount).toBe('50');
      expect(result?.recipient).toBe('mama.family.eth');
    });

    it('should parse "pay kofi.ghana.eth 100 dollars"', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'pay kofi.ghana.eth 100 dollars'
      );

      expect(result).toBeDefined();
      expect(result?.action).toBe('send_money');
      expect(result?.amount).toBe('100');
      expect(result?.recipient).toBe('kofi.ghana.eth');
    });

    it('should parse "transfer 25 USDC to friend.wallet.eth"', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'transfer 25 usdc to friend.wallet.eth'
      );

      expect(result).toBeDefined();
      expect(result?.action).toBe('send_money');
      expect(result?.amount).toBe('25');
      expect(result?.currency).toBe('usdc');
    });

    it('should handle Twi commands', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'fa aduonum cedis kɔma kofi.ghana.eth',
        'tw'
      );

      expect(result?.action).toBe('send_money');
      expect(result?.language).toBe('tw');
    });

    it('should handle check balance commands', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'check my balance'
      );

      expect(result?.action).toBe('check_balance');
    });

    it('should handle transaction history commands', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'show my transaction history'
      );

      expect(result?.action).toBe('transaction_history');
    });

    it('should return null for invalid commands', async () => {
      const result = await voiceCommandProcessor.extractPaymentIntent(
        'hello world random text'
      );

      expect(result).toBeNull();
    });
  });

  describe('correctVoiceRecognitionErrors', () => {
    it('should correct "dot eat" to ".eth"', () => {
      const corrected = voiceCommandProcessor.correctVoiceRecognitionErrors(
        'send 100 to mama dot eat'
      );

      expect(corrected).toContain('.eth');
    });

    it('should correct "cities" to "cedis"', () => {
      const corrected = voiceCommandProcessor.correctVoiceRecognitionErrors(
        'send 100 cities to friend'
      );

      expect(corrected).toContain('cedis');
    });

    it('should correct "you as the sea" to "usdc"', () => {
      const corrected = voiceCommandProcessor.correctVoiceRecognitionErrors(
        'send 50 you as the sea to wallet'
      );

      expect(corrected).toContain('usdc');
    });
  });

  describe('validateVoiceCommand', () => {
    it('should validate correct payment intent', () => {
      const intent: PaymentIntent = {
        action: 'send_money',
        amount: '50',
        currency: 'cedis',
        recipient: 'test.eth',
        confidence: 0.95,
        rawTranscript: 'send 50 cedis to test.eth',
        language: 'en',
        metadata: { timestamp: Date.now(), processingTime: 100, patterns: [] },
      };

      const validation = voiceCommandProcessor.validateVoiceCommand(intent);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject amounts over limit', () => {
      const intent: PaymentIntent = {
        action: 'send_money',
        amount: '999999',
        currency: 'cedis',
        recipient: 'test.eth',
        confidence: 0.9,
        rawTranscript: 'test',
        language: 'en',
        metadata: { timestamp: Date.now(), processingTime: 0, patterns: [] },
      };

      const validation = voiceCommandProcessor.validateVoiceCommand(intent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Amount exceeds maximum limit');
    });

    it('should reject amounts below minimum', () => {
      const intent: PaymentIntent = {
        action: 'send_money',
        amount: '0.001',
        currency: 'cedis',
        recipient: 'test.eth',
        confidence: 0.9,
        rawTranscript: 'test',
        language: 'en',
        metadata: { timestamp: Date.now(), processingTime: 0, patterns: [] },
      };

      const validation = voiceCommandProcessor.validateVoiceCommand(intent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Amount below minimum limit');
    });

    it('should reject invalid amounts', () => {
      const intent: PaymentIntent = {
        action: 'send_money',
        amount: 'invalid',
        currency: 'cedis',
        recipient: 'test.eth',
        confidence: 0.9,
        rawTranscript: 'test',
        language: 'en',
        metadata: { timestamp: Date.now(), processingTime: 0, patterns: [] },
      };

      const validation = voiceCommandProcessor.validateVoiceCommand(intent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid amount specified');
    });

    it('should reject low confidence', () => {
      const intent: PaymentIntent = {
        action: 'send_money',
        amount: '50',
        currency: 'cedis',
        recipient: 'test.eth',
        confidence: 0.5,
        rawTranscript: 'test',
        language: 'en',
        metadata: { timestamp: Date.now(), processingTime: 0, patterns: [] },
      };

      const validation = voiceCommandProcessor.validateVoiceCommand(intent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('confidence too low');
    });
  });

  describe('getSuggestedCommands', () => {
    it('should suggest payment commands for "send"', () => {
      const suggestions = voiceCommandProcessor.getSuggestedCommands('send');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('cedis');
    });

    it('should suggest balance commands for "balance"', () => {
      const suggestions = voiceCommandProcessor.getSuggestedCommands('check balance');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('balance');
    });

    it('should suggest history commands for "history"', () => {
      const suggestions = voiceCommandProcessor.getSuggestedCommands('show history');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('history');
    });
  });
});
