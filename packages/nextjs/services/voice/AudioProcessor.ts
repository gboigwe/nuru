/**
 * Audio processing service for voice recognition in VoicePay Africa
 * Handles audio capture, preprocessing, and transcription
 */

export interface AudioRecordingOptions {
  duration?: number; // Maximum recording duration in ms
  sampleRate?: number; // Audio sample rate
  channels?: number; // Number of audio channels
  mimeType?: string; // Audio format
  enableVAD?: boolean; // Enable Voice Activity Detection
}

export interface AudioProcessingResult {
  audioBlob: Blob;
  duration: number;
  size: number;
  waveform?: number[];
  transcript?: string;
  confidence?: number;
}

export interface VoiceRecognitionConfig {
  language: 'en-US' | 'en-GH' | 'tw-GH' | 'ha-NG';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export class AudioProcessor {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  
  // Voice Activity Detection
  private analyser: AnalyserNode | null = null;
  private vadThreshold = 30; // Voice activity detection threshold
  private silenceTimeout = 2000; // Stop recording after 2s of silence
  private silenceTimer: NodeJS.Timeout | null = null;

  private readonly DEFAULT_OPTIONS: AudioRecordingOptions = {
    duration: 30000, // 30 seconds max
    sampleRate: 16000, // Optimal for speech recognition
    channels: 1, // Mono audio
    mimeType: 'audio/webm;codecs=opus'
  };

  /**
   * Initialize audio processing with microphone access
   */
  async initialize(): Promise<boolean> {
    try {
      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.audioStream = stream;
      
      // Initialize audio context for analysis
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      // Connect audio stream to analyser
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      console.log('Audio processor initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw new Error(`Microphone access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start recording audio with voice activity detection
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    if (!this.audioStream) {
      throw new Error('Audio processor not initialized');
    }

    if (this.isRecording) {
      throw new Error('Already recording');
    }

    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: config.mimeType
      });

      this.recordedChunks = [];
      this.isRecording = true;

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      // Set maximum duration timeout
      if (config.duration) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, config.duration);
      }

      // Start voice activity detection if enabled
      if (config.enableVAD !== false) { // Default to true if not specified
        this.startVoiceActivityDetection();
      }

      console.log('Audio recording started');

    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop recording and return processed audio
   */
  async stopRecording(): Promise<AudioProcessingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Create audio blob from recorded chunks
          const audioBlob = new Blob(this.recordedChunks, { 
            type: this.mediaRecorder!.mimeType 
          });

          // Calculate duration and other metrics
          const duration = await this.getAudioDuration(audioBlob);
          const waveform = await this.generateWaveform(audioBlob);

          const result: AudioProcessingResult = {
            audioBlob,
            duration,
            size: audioBlob.size,
            waveform
          };

          resolve(result);

        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Process audio for voice recognition
   */
  async processAudioForRecognition(audioBlob: Blob): Promise<AudioProcessingResult> {
    try {
      // Basic audio processing
      const duration = await this.getAudioDuration(audioBlob);
      const waveform = await this.generateWaveform(audioBlob);

      // Apply audio filters for better recognition
      const processedBlob = await this.applyAudioFilters(audioBlob);

      return {
        audioBlob: processedBlob,
        duration,
        size: processedBlob.size,
        waveform
      };

    } catch (error) {
      throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API (more accurate for African accents)
   */
  async transcribeAudio(
    audioBlob: Blob, 
    config: VoiceRecognitionConfig = {
      language: 'en-US',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1
    }
  ): Promise<{ transcript: string; confidence: number }> {
    try {
      // Import OpenAI service dynamically to avoid server-side issues
      const { openAITranscriptionService } = await import('./OpenAITranscriptionService');
      
      // Check if OpenAI service is configured
      if (!openAITranscriptionService.isConfigured()) {
        console.warn('OpenAI not configured, falling back to Web Speech API');
        return this.fallbackWebSpeechAPI(audioBlob, config);
      }

      // Use OpenAI Whisper for transcription
      console.log('Transcribing with OpenAI Whisper...');
      const result = await openAITranscriptionService.transcribePaymentCommand(audioBlob);
      
      // Calculate confidence based on result quality
      let confidence = 0.9; // OpenAI Whisper is generally very accurate
      
      // Adjust confidence based on result quality indicators
      if (result.segments && result.segments.length > 0) {
        const avgLogProb = result.segments.reduce((acc, seg) => acc + seg.avg_logprob, 0) / result.segments.length;
        const avgNoSpeechProb = result.segments.reduce((acc, seg) => acc + seg.no_speech_prob, 0) / result.segments.length;
        
        // Higher avg_logprob (closer to 0) and lower no_speech_prob indicate better quality
        confidence = Math.max(0.5, Math.min(0.99, 0.9 + (avgLogProb / 5) - (avgNoSpeechProb * 2)));
      }

      return {
        transcript: result.text.trim(),
        confidence: confidence
      };

    } catch (error) {
      console.warn('OpenAI transcription failed, falling back to Web Speech API:', error);
      return this.fallbackWebSpeechAPI(audioBlob, config);
    }
  }

  /**
   * Fallback to Web Speech API when OpenAI is not available
   */
  private async fallbackWebSpeechAPI(
    audioBlob: Blob,
    config: VoiceRecognitionConfig
  ): Promise<{ transcript: string; confidence: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          reject(new Error('Speech recognition not supported in this browser'));
          return;
        }

        // Convert blob to audio for playback (hack for speech recognition)
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        const recognition = new SpeechRecognition();
        recognition.lang = config.language;
        recognition.continuous = config.continuous;
        recognition.interimResults = config.interimResults;
        recognition.maxAlternatives = config.maxAlternatives;

        let timeoutId: NodeJS.Timeout | null = null;

        recognition.onresult = (event: any) => {
          if (timeoutId) clearTimeout(timeoutId);
          
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.5; // Web Speech API doesn't always provide confidence

          URL.revokeObjectURL(audioUrl);
          resolve({ transcript, confidence });
        };

        recognition.onerror = (event: any) => {
          if (timeoutId) clearTimeout(timeoutId);
          URL.revokeObjectURL(audioUrl);
          reject(new Error(`Speech recognition error: ${event.error}`));
        };

        recognition.onend = () => {
          URL.revokeObjectURL(audioUrl);
        };

        // Set timeout to prevent hanging
        timeoutId = setTimeout(() => {
          recognition.stop();
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Speech recognition timeout'));
        }, 10000); // 10 second timeout

        // Start recognition
        recognition.start();

        // Play audio to trigger recognition (doesn't always work but helps)
        audio.play().catch(() => {
          console.warn('Audio playback failed, but recognition might still work');
        });

      } catch (error) {
        reject(new Error(`Fallback transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Check if audio contains speech
   */
  async detectSpeech(audioBlob: Blob): Promise<boolean> {
    try {
      if (!this.audioContext) return false;

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Analyze audio for voice activity
      const channelData = audioBuffer.getChannelData(0);
      let rms = 0;
      
      for (let i = 0; i < channelData.length; i++) {
        rms += channelData[i] * channelData[i];
      }
      
      rms = Math.sqrt(rms / channelData.length);
      const db = 20 * Math.log10(rms);
      
      // Return true if audio level is above threshold
      return db > -60; // Adjust threshold as needed

    } catch (error) {
      console.error('Speech detection failed:', error);
      return false;
    }
  }

  /**
   * Get current audio level for UI feedback
   */
  getCurrentAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }

    return (sum / bufferLength) / 255 * 100; // Return as percentage
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
    this.isRecording = false;
  }

  // Private helper methods

  private startVoiceActivityDetection(): void {
    if (!this.analyser) return;

    const checkVoiceActivity = () => {
      if (!this.isRecording) return;

      const audioLevel = this.getCurrentAudioLevel();

      if (audioLevel < this.vadThreshold) {
        // Start silence timer if not already started
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            if (this.isRecording) {
              console.log('Stopping recording due to silence');
              this.stopRecording();
            }
          }, this.silenceTimeout);
        }
      } else {
        // Cancel silence timer if voice is detected
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      }

      // Continue monitoring
      requestAnimationFrame(checkVoiceActivity);
    };

    checkVoiceActivity();
  }

  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration * 1000); // Return in milliseconds
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  private async generateWaveform(audioBlob: Blob): Promise<number[]> {
    try {
      if (!this.audioContext) return [];

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate simplified waveform (100 points)
      const waveform: number[] = [];
      const blockSize = Math.floor(channelData.length / 100);
      
      for (let i = 0; i < 100; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;
        
        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j] || 0);
        }
        
        waveform.push(sum / blockSize);
      }
      
      return waveform;

    } catch (error) {
      console.error('Waveform generation failed:', error);
      return [];
    }
  }

  private async applyAudioFilters(audioBlob: Blob): Promise<Blob> {
    // For now, return the original blob
    // In a production environment, you might apply noise reduction,
    // normalization, or other audio processing techniques
    return audioBlob;
  }

  // Getters
  get recording(): boolean {
    return this.isRecording;
  }

  get hasAudioAccess(): boolean {
    return this.audioStream !== null;
  }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();