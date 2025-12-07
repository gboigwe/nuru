export interface WhisperTranscriptionResult {
  success: boolean;
  transcript: string;
  confidence: number;
  language?: string;
  duration?: number;
  error?: string;
}

export class WhisperRecognitionService {
  private apiEndpoint = '/api/transcribe';

  async transcribe(audioBlob: Blob, language: string = 'en'): Promise<WhisperTranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', language);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const result = await response.json();

      return {
        success: true,
        transcript: result.transcript,
        confidence: result.confidence || 0.85,
        language: result.language,
        duration: result.duration,
      };

    } catch (error) {
      return {
        success: false,
        transcript: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transcribeWithRetry(
    audioBlob: Blob,
    language: string = 'en',
    maxRetries: number = 2
  ): Promise<WhisperTranscriptionResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.transcribe(audioBlob, language);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      if (attempt < maxRetries) {
        await this.sleep(1000 * attempt);
      }
    }

    return {
      success: false,
      transcript: '',
      confidence: 0,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const whisperRecognition = new WhisperRecognitionService();
