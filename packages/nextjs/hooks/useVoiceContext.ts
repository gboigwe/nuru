/**
 * Voice Conversation Context Hook
 *
 * Manages conversation context for follow-up voice commands
 * Persists context in localStorage with 5-minute expiry
 */

import { useEffect, useState, useCallback } from 'react';
import { voiceCommandProcessor } from '~~/services/voice/VoiceCommandProcessor';

const CONTEXT_STORAGE_KEY = 'nuru_voice_context';
const CONTEXT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export interface VoiceContext {
  previousRecipient?: string;
  previousAmount?: string;
  previousCurrency?: string;
  timestamp: number;
}

export function useVoiceContext() {
  const [context, setContext] = useState<VoiceContext | null>(null);

  // Load context from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;

        if (age < CONTEXT_MAX_AGE) {
          setContext(parsed);
          // Restore to OpenAI service
          voiceCommandProcessor.setConversationContext({
            previousRecipient: parsed.previousRecipient,
            previousAmount: parsed.previousAmount,
            previousCurrency: parsed.previousCurrency,
            conversationHistory: [],
            timestamp: parsed.timestamp,
          });
        } else {
          // Context expired, clear it
          localStorage.removeItem(CONTEXT_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to parse voice context:', error);
        localStorage.removeItem(CONTEXT_STORAGE_KEY);
      }
    }
  }, []);

  // Save context to localStorage
  const saveContext = useCallback((newContext: Partial<VoiceContext>) => {
    const updated = {
      ...context,
      ...newContext,
      timestamp: Date.now(),
    };

    setContext(updated);
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(updated));

    // Update OpenAI service context
    const serviceContext = voiceCommandProcessor.getConversationContext();
    voiceCommandProcessor.setConversationContext({
      ...serviceContext,
      previousRecipient: updated.previousRecipient,
      previousAmount: updated.previousAmount,
      previousCurrency: updated.previousCurrency,
    });
  }, [context]);

  // Clear context
  const clearContext = useCallback(() => {
    setContext(null);
    localStorage.removeItem(CONTEXT_STORAGE_KEY);
    voiceCommandProcessor.clearConversationContext();
  }, []);

  // Update context after successful payment
  const updateAfterPayment = useCallback(
    (recipient: string, amount: string, currency: string) => {
      saveContext({
        previousRecipient: recipient,
        previousAmount: amount,
        previousCurrency: currency,
      });
    },
    [saveContext],
  );

  return {
    context,
    saveContext,
    clearContext,
    updateAfterPayment,
    hasContext: context !== null,
  };
}
