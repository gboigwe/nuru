import { useState, useCallback, useRef } from 'react';
import { voiceRecognitionService, UnifiedVoiceResult } from '~/services/voice/VoiceRecognitionService';

export const useVoiceRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'web-speech' | 'whisper' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setConfidence(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          const result: UnifiedVoiceResult = await voiceRecognitionService.recognizeFromAudio(audioBlob);

          if (result.success) {
            setTranscript(result.transcript);
            setConfidence(result.confidence);
            setMethod(result.method);
          } else {
            setError(result.error || 'Recognition failed');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
    setMethod(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    confidence,
    error,
    method,
    startRecording,
    stopRecording,
    reset,
    isSupported: voiceRecognitionService.isWebSpeechSupported(),
  };
};
