import OpenAI from 'openai';

/**
 * OpenAI Whisper transcription service for accurate voice recognition
 * Optimized for African English accents and multiple languages
 */

export interface TranscriptionOptions {
  language?: string; // 'en', 'zh', 'fr', 'es', etc.
  model?: 'whisper-1';
  prompt?: string; // Context for better transcription
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1, controls randomness
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

export class OpenAITranscriptionService {
  private openai: OpenAI;
  private isInitialized = false;

  constructor() {
    // Initialize with API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Enable client-side usage
    });
  }

  /**
   * Initialize the transcription service
   */
  async initialize(): Promise<boolean> {
    try {
      // Test API connection with a simple request
      // We can't really test without making a request, so we'll mark as initialized
      this.isInitialized = true;
      console.log('OpenAI transcription service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
      throw new Error('OpenAI service initialization failed');
    }
  }

  /**
   * Transcribe audio blob using OpenAI Whisper
   */
  async transcribeAudio(
    audioBlob: Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      // Convert blob to File object (required by OpenAI SDK)
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm'
      });

      // Default options optimized for voice payments
      const transcriptionOptions: TranscriptionOptions = {
        model: 'whisper-1',
        language: 'en', // English, but Whisper auto-detects
        response_format: 'verbose_json', // Get detailed response
        temperature: 0, // Most accurate transcription
        prompt: 'This is a voice command for a cryptocurrency payment. Common words include: send, transfer, pay, dollars, cedis, USDC, ETH, to, mama, family, friend, wallet address, ENS name.',
        ...options
      };

      console.log('Transcribing audio with OpenAI Whisper...');
      const startTime = Date.now();

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: transcriptionOptions.model!,
        language: transcriptionOptions.language,
        response_format: transcriptionOptions.response_format,
        temperature: transcriptionOptions.temperature,
        prompt: transcriptionOptions.prompt,
      });

      const processingTime = Date.now() - startTime;
      console.log(`Transcription completed in ${processingTime}ms`);

      // Handle different response formats
      if (transcriptionOptions.response_format === 'verbose_json') {
        const verboseResponse = transcription as any;
        return {
          text: verboseResponse.text,
          language: verboseResponse.language,
          duration: verboseResponse.duration,
          segments: verboseResponse.segments
        };
      } else {
        return {
          text: typeof transcription === 'string' ? transcription : transcription.text || '',
        };
      }

    } catch (error) {
      console.error('OpenAI transcription failed:', error);
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid OpenAI API key. Please check your environment variables.');
        } else if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing.');
        } else if (error.message.includes('rate limit')) {
          throw new Error('OpenAI API rate limit reached. Please try again in a moment.');
        } else {
          throw new Error(`Transcription failed: ${error.message}`);
        }
      }
      
      throw new Error('Unknown transcription error occurred');
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async transcribeMultipleAudio(
    audioBlobs: Blob[],
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult[]> {
    const results: TranscriptionResult[] = [];
    
    for (const [index, blob] of audioBlobs.entries()) {
      try {
        console.log(`Transcribing audio ${index + 1}/${audioBlobs.length}`);
        const result = await this.transcribeAudio(blob, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to transcribe audio ${index + 1}:`, error);
        results.push({
          text: '',
          // Add error info in segments if needed
        });
      }
    }
    
    return results;
  }

  /**
   * Get transcription optimized for payment commands
   */
  async transcribePaymentCommand(audioBlob: Blob): Promise<TranscriptionResult> {
    return this.transcribeAudio(audioBlob, {
      language: 'en',
      model: 'whisper-1',
      response_format: 'verbose_json',
      temperature: 0,
      prompt: `This is a voice command for sending cryptocurrency payments. The user might say commands like:
        - "Send 50 cedis to mama.family.eth"
        - "Transfer 100 USDC to friend.eth" 
        - "Pay kofi.ghana.eth 25 dollars"
        - "Send 0.1 ETH to john.ens.eth"
        Common currencies: cedis, dollars, USDC, ETH, GHS, USD
        Common recipients: mama, friend, family, brother, sister, kofi, ama, kwame
        ENS domains: .eth, .family.eth, .ghana.eth, .ens.eth`
    });
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY && this.isInitialized;
  }

  /**
   * Get service status and recommendations
   */
  getServiceStatus(): {
    configured: boolean;
    initialized: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (!process.env.OPENAI_API_KEY) {
      recommendations.push('Set OPENAI_API_KEY environment variable');
    }
    
    if (!this.isInitialized) {
      recommendations.push('Call initialize() before using transcription');
    }

    return {
      configured: !!process.env.OPENAI_API_KEY,
      initialized: this.isInitialized,
      recommendations
    };
  }
}

// Export singleton instance
export const openAITranscriptionService = new OpenAITranscriptionService();