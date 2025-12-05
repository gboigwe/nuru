/**
 * Web Speech Recognition Service
 *
 * Implements real voice recognition using the Web Speech API
 * Falls back to simulated recognition if not supported by browser
 *
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Partial support
 * - Firefox: Limited support (requires flag)
 */

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export type VoiceRecognitionCallback = (result: VoiceRecognitionResult) => void;
export type VoiceRecognitionErrorCallback = (error: string) => void;

class WebSpeechRecognitionService {
  private recognition: any | null = null;
  private isListening = false;
  private isBrowserSupported = false;

  constructor() {
    this.initializeRecognition();
  }

  /**
   * Initialize the Web Speech API
   */
  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition =
      (typeof window !== 'undefined' && (window as any).SpeechRecognition) ||
      (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition);

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isBrowserSupported = true;
    } else {
      console.warn('Web Speech API not supported in this browser');
      this.isBrowserSupported = false;
    }
  }

  /**
   * Check if Web Speech API is supported
   */
  isSupported(): boolean {
    return this.isBrowserSupported;
  }

  /**
   * Start listening for voice input
   */
  startListening(
    onResult: VoiceRecognitionCallback,
    onError: VoiceRecognitionErrorCallback,
    options: VoiceRecognitionOptions = {},
  ): void {
    if (!this.isBrowserSupported) {
      onError('Web Speech API not supported in your browser');
      return;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    // Configure recognition
    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    // Set up event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      const transcript = latestResult[0].transcript;
      const confidence = latestResult[0].confidence;
      const isFinal = latestResult.isFinal;

      onResult({
        transcript: transcript.trim(),
        confidence,
        isFinal,
        timestamp: Date.now(),
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      let errorMessage = 'An error occurred during voice recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      onError('Failed to start voice recognition');
      this.isListening = false;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort recognition immediately
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Get list of supported languages (common subset)
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'en-GH', name: 'English (Ghana)' },
      { code: 'en-NG', name: 'English (Nigeria)' },
      { code: 'en-KE', name: 'English (Kenya)' },
      { code: 'en-ZA', name: 'English (South Africa)' },
      { code: 'fr-FR', name: 'French' },
      { code: 'sw-KE', name: 'Swahili (Kenya)' },
      { code: 'yo-NG', name: 'Yoruba (Nigeria)' },
      { code: 'ig-NG', name: 'Igbo (Nigeria)' },
      { code: 'ha-NG', name: 'Hausa (Nigeria)' },
    ];
  }
}

// Singleton instance
export const webSpeechRecognition = new WebSpeechRecognitionService();
