import { webSpeechRecognition, VoiceRecognitionResult as WebSpeechResult } from './WebSpeechRecognition';
import { whisperRecognition, WhisperTranscriptionResult } from './WhisperRecognition';

export interface UnifiedVoiceResult {
  success: boolean;
  transcript: string;
  confidence: number;
  method: 'web-speech' | 'whisper';
  isFinal: boolean;
  error?: string;
}

export class VoiceRecognitionService {
  private useWebSpeech = true;

  constructor() {
    this.useWebSpeech = webSpeechRecognition.isSupported();
  }

  async recognizeFromAudio(audioBlob: Blob, language: string = 'en-US'): Promise<UnifiedVoiceResult> {
    if (this.useWebSpeech) {
      return new Promise((resolve) => {
        let resolved = false;

        webSpeechRecognition.startListening(
          (result: WebSpeechResult) => {
            if (result.isFinal && !resolved) {
              resolved = true;
              webSpeechRecognition.stopListening();
              resolve({
                success: true,
                transcript: result.transcript,
                confidence: result.confidence,
                method: 'web-speech',
                isFinal: true,
              });
            }
          },
          async (error: string) => {
            if (!resolved) {
              resolved = true;
              const whisperResult = await whisperRecognition.transcribe(audioBlob, language.split('-')[0]);
              resolve({
                success: whisperResult.success,
                transcript: whisperResult.transcript,
                confidence: whisperResult.confidence,
                method: 'whisper',
                isFinal: true,
                error: whisperResult.error,
              });
            }
          },
          { language, enableVAD: true, confidenceThreshold: 0.5 }
        );

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            webSpeechRecognition.stopListening();
            this.fallbackToWhisper(audioBlob, language).then(resolve);
          }
        }, 10000);
      });
    }

    return this.fallbackToWhisper(audioBlob, language);
  }

  private async fallbackToWhisper(audioBlob: Blob, language: string): Promise<UnifiedVoiceResult> {
    const result = await whisperRecognition.transcribeWithRetry(audioBlob, language.split('-')[0]);

    return {
      success: result.success,
      transcript: result.transcript,
      confidence: result.confidence,
      method: 'whisper',
      isFinal: true,
      error: result.error,
    };
  }

  isWebSpeechSupported(): boolean {
    return this.useWebSpeech;
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
