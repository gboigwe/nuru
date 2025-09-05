import { audioProcessor, AudioProcessor, AudioProcessingResult } from './AudioProcessor';
import { voiceCommandProcessor, VoiceCommandProcessor, PaymentIntent } from './VoiceCommandProcessor';

/**
 * Complete voice recognition pipeline for VoicePay Africa
 * Handles end-to-end voice processing from audio capture to payment intent
 */

export interface VoiceRecognitionResult {
  success: boolean;
  audioData?: AudioProcessingResult;
  transcript?: string;
  transcriptionConfidence?: number;
  paymentIntent?: PaymentIntent;
  processingTime: number;
  error?: string;
  suggestions?: string[];
}

export interface VoiceRecognitionOptions {
  maxDuration?: number;
  language?: 'en-US' | 'en-GH' | 'tw-GH' | 'ha-NG';
  enableVAD?: boolean; // Voice Activity Detection
  confidenceThreshold?: number;
}

export interface VoiceSessionState {
  isInitialized: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  currentAudioLevel: number;
  sessionId: string;
  startTime?: number;
}

export class VoiceRecognitionPipeline {
  private audioProcessor: AudioProcessor;
  private voiceProcessor: VoiceCommandProcessor;
  private sessionState: VoiceSessionState;
  private audioLevelUpdateInterval: NodeJS.Timeout | null = null;
  
  private readonly DEFAULT_OPTIONS: VoiceRecognitionOptions = {
    maxDuration: 30000, // 30 seconds
    language: 'en-US',
    enableVAD: true,
    confidenceThreshold: 0.7
  };

  constructor() {
    this.audioProcessor = audioProcessor;
    this.voiceProcessor = voiceCommandProcessor;
    this.sessionState = {
      isInitialized: false,
      isRecording: false,
      isProcessing: false,
      currentAudioLevel: 0,
      sessionId: this.generateSessionId()
    };
  }

  /**
   * Initialize the voice recognition pipeline
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing voice recognition pipeline...');
      
      // Try to initialize audio processor, but don't fail if microphone permission is denied
      try {
        await this.audioProcessor.initialize();
        console.log('Audio processor initialized successfully');
      } catch (audioError) {
        if (audioError instanceof Error && audioError.message.includes('Microphone access denied')) {
          console.warn('Microphone permission not granted yet - will request when recording starts');
          // Don't throw error, allow initialization to continue
        } else {
          throw audioError;
        }
      }
      
      this.sessionState.isInitialized = true;
      console.log('Voice recognition pipeline initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize voice recognition pipeline:', error);
      throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start voice recognition session
   */
  async startVoiceRecognition(
    options: VoiceRecognitionOptions = {},
    onUpdate?: (state: VoiceSessionState) => void
  ): Promise<void> {
    if (!this.sessionState.isInitialized) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    if (this.sessionState.isRecording) {
      throw new Error('Voice recognition already in progress');
    }

    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Update session state
      this.sessionState.isRecording = true;
      this.sessionState.startTime = Date.now();
      this.sessionState.sessionId = this.generateSessionId();
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring(onUpdate);
      
      // Start recording with specified options
      await this.audioProcessor.startRecording({
        duration: config.maxDuration,
        sampleRate: 16000,
        channels: 1,
        mimeType: 'audio/webm;codecs=opus',
        enableVAD: config.enableVAD
      });

      console.log(`Voice recording started (session: ${this.sessionState.sessionId})`);
      
      // Notify state update
      if (onUpdate) {
        onUpdate({ ...this.sessionState });
      }

    } catch (error) {
      this.sessionState.isRecording = false;
      this.stopAudioLevelMonitoring();
      throw new Error(`Failed to start voice recognition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop voice recognition and process the recorded audio
   */
  async stopVoiceRecognition(): Promise<VoiceRecognitionResult> {
    const startTime = Date.now();

    if (!this.sessionState.isRecording) {
      return {
        success: false,
        error: 'No active recording to stop',
        processingTime: 0
      };
    }

    try {
      // Update state
      this.sessionState.isRecording = false;
      this.sessionState.isProcessing = true;
      this.stopAudioLevelMonitoring();

      console.log('Stopping voice recording and processing...');

      // Stop recording and get audio data
      const audioData = await this.audioProcessor.stopRecording();
      
      // Check if audio contains speech
      const hasSpeech = await this.audioProcessor.detectSpeech(audioData.audioBlob);
      if (!hasSpeech) {
        return {
          success: false,
          error: 'No speech detected in audio',
          audioData,
          processingTime: Date.now() - startTime
        };
      }

      // Process audio for recognition
      const processedAudio = await this.audioProcessor.processAudioForRecognition(audioData.audioBlob);

      // Transcribe audio
      let transcript = '';
      let transcriptionConfidence = 0;
      
      try {
        const transcriptionResult = await this.audioProcessor.transcribeAudio(
          processedAudio.audioBlob,
          {
            language: 'en-US', // Default to English, can be configured
            continuous: false,
            interimResults: false,
            maxAlternatives: 1
          }
        );
        
        transcript = transcriptionResult.transcript;
        transcriptionConfidence = transcriptionResult.confidence;
        
      } catch (transcriptionError) {
        console.warn('Transcription failed, using fallback method:', transcriptionError);
        // Fallback: return audio data for manual processing
        return {
          success: false,
          error: 'Speech transcription failed',
          audioData: processedAudio,
          processingTime: Date.now() - startTime,
          suggestions: ['Try speaking more clearly', 'Check microphone settings', 'Try again in a quieter environment']
        };
      }

      // Extract payment intent from transcript
      let paymentIntent: PaymentIntent | null = null;
      if (transcript) {
        try {
          paymentIntent = await this.voiceProcessor.extractPaymentIntent(transcript);
        } catch (intentError) {
          console.warn('Payment intent extraction failed:', intentError);
        }
      }

      // Generate suggestions if needed
      const suggestions = !paymentIntent ? 
        this.voiceProcessor.getSuggestedCommands(transcript) : 
        [];

      const result: VoiceRecognitionResult = {
        success: !!paymentIntent && transcriptionConfidence >= this.DEFAULT_OPTIONS.confidenceThreshold!,
        audioData: processedAudio,
        transcript,
        transcriptionConfidence,
        paymentIntent: paymentIntent || undefined,
        processingTime: Date.now() - startTime,
        suggestions
      };

      // If unsuccessful, provide helpful error message
      if (!result.success) {
        if (transcriptionConfidence < this.DEFAULT_OPTIONS.confidenceThreshold!) {
          result.error = `Low confidence transcription (${Math.round(transcriptionConfidence * 100)}%). Please speak more clearly.`;
        } else if (!paymentIntent) {
          result.error = 'Could not understand payment command. Try saying "Send 50 cedis to mama.family.eth"';
        }
      }

      this.sessionState.isProcessing = false;
      console.log(`Voice processing completed in ${result.processingTime}ms`);

      return result;

    } catch (error) {
      this.sessionState.isProcessing = false;
      
      return {
        success: false,
        error: `Voice processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process pre-recorded audio file
   */
  async processAudioFile(audioFile: File, options: VoiceRecognitionOptions = {}): Promise<VoiceRecognitionResult> {
    const startTime = Date.now();
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      console.log('Processing uploaded audio file...');

      // Convert file to blob if needed
      const audioBlob = audioFile instanceof Blob ? audioFile : new Blob([audioFile]);

      // Process audio
      const audioData = await this.audioProcessor.processAudioForRecognition(audioBlob);

      // Check if audio contains speech
      const hasSpeech = await this.audioProcessor.detectSpeech(audioData.audioBlob);
      if (!hasSpeech) {
        return {
          success: false,
          error: 'No speech detected in audio file',
          audioData,
          processingTime: Date.now() - startTime
        };
      }

      // Transcribe audio
      const transcriptionResult = await this.audioProcessor.transcribeAudio(
        audioData.audioBlob,
        {
          language: config.language || 'en-US',
          continuous: false,
          interimResults: false,
          maxAlternatives: 1
        }
      );

      // Extract payment intent
      const paymentIntent = await this.voiceProcessor.extractPaymentIntent(transcriptionResult.transcript);

      // Generate suggestions if needed
      const suggestions = !paymentIntent ? 
        this.voiceProcessor.getSuggestedCommands(transcriptionResult.transcript) : 
        [];

      const result: VoiceRecognitionResult = {
        success: !!paymentIntent && transcriptionResult.confidence >= config.confidenceThreshold!,
        audioData,
        transcript: transcriptionResult.transcript,
        transcriptionConfidence: transcriptionResult.confidence,
        paymentIntent: paymentIntent || undefined,
        processingTime: Date.now() - startTime,
        suggestions
      };

      if (!result.success && !result.error) {
        if (transcriptionResult.confidence < config.confidenceThreshold!) {
          result.error = `Low confidence transcription (${Math.round(transcriptionResult.confidence * 100)}%)`;
        } else if (!paymentIntent) {
          result.error = 'Could not understand payment command from audio';
        }
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: `Audio file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test microphone and speech recognition
   */
  async testMicrophoneAndRecognition(): Promise<{
    microphoneAccess: boolean;
    speechRecognitionSupport: boolean;
    audioLevel: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    try {
      // Test microphone access
      const microphoneAccess = this.audioProcessor.hasAudioAccess;
      if (!microphoneAccess) {
        recommendations.push('Grant microphone permission in browser settings');
      }

      // Test speech recognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const speechRecognitionSupport = !!SpeechRecognition;
      if (!speechRecognitionSupport) {
        recommendations.push('Use Chrome or Edge browser for better speech recognition');
      }

      // Get current audio level
      const audioLevel = this.audioProcessor.getCurrentAudioLevel();
      if (audioLevel < 10) {
        recommendations.push('Speak louder or check microphone settings');
      }

      return {
        microphoneAccess,
        speechRecognitionSupport,
        audioLevel,
        recommendations
      };

    } catch (error) {
      recommendations.push('Check browser compatibility and permissions');
      
      return {
        microphoneAccess: false,
        speechRecognitionSupport: false,
        audioLevel: 0,
        recommendations
      };
    }
  }

  /**
   * Get current session state
   */
  getSessionState(): VoiceSessionState {
    return { ...this.sessionState };
  }

  /**
   * Cancel current voice recognition session
   */
  cancelVoiceRecognition(): void {
    this.sessionState.isRecording = false;
    this.sessionState.isProcessing = false;
    this.stopAudioLevelMonitoring();
    
    // Stop audio processor if recording
    if (this.audioProcessor.recording) {
      try {
        this.audioProcessor.stopRecording();
      } catch (error) {
        console.warn('Failed to stop audio recording:', error);
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.cancelVoiceRecognition();
    this.audioProcessor.cleanup();
    this.sessionState.isInitialized = false;
  }

  // Private helper methods

  private generateSessionId(): string {
    return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAudioLevelMonitoring(onUpdate?: (state: VoiceSessionState) => void): void {
    this.audioLevelUpdateInterval = setInterval(() => {
      if (this.sessionState.isRecording) {
        this.sessionState.currentAudioLevel = this.audioProcessor.getCurrentAudioLevel();
        
        if (onUpdate) {
          onUpdate({ ...this.sessionState });
        }
      }
    }, 100); // Update every 100ms
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelUpdateInterval) {
      clearInterval(this.audioLevelUpdateInterval);
      this.audioLevelUpdateInterval = null;
    }
    this.sessionState.currentAudioLevel = 0;
  }
}

// Export singleton instance
export const voiceRecognitionPipeline = new VoiceRecognitionPipeline();