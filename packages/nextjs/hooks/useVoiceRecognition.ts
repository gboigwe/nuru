"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  webSpeechRecognition,
  VoiceRecognitionResult,
  VoiceRecognitionOptions,
} from '~~/services/voice/WebSpeechRecognition';

/**
 * useVoiceRecognition Hook
 *
 * React hook for voice recognition using Web Speech API
 */

export interface UseVoiceRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  confidence: number | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: VoiceRecognitionOptions = {},
): UseVoiceRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => webSpeechRecognition.isSupported());

  const finalTranscriptRef = useRef('');

  const handleResult = useCallback((result: VoiceRecognitionResult) => {
    if (result.isFinal) {
      // Final result
      const newTranscript = finalTranscriptRef.current + ' ' + result.transcript;
      finalTranscriptRef.current = newTranscript.trim();
      setTranscript(newTranscript.trim());
      setInterimTranscript('');
      setConfidence(result.confidence);
    } else {
      // Interim result
      setInterimTranscript(result.transcript);
    }
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice recognition is not supported in your browser');
      return;
    }

    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setConfidence(null);

    webSpeechRecognition.startListening(handleResult, handleError, options);
    setIsListening(true);
  }, [isSupported, options, handleResult, handleError]);

  const stopListening = useCallback(() => {
    webSpeechRecognition.stopListening();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setConfidence(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        webSpeechRecognition.abort();
      }
    };
  }, [isListening]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
