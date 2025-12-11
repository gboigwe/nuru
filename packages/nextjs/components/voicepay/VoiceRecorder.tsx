'use client';

import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => Promise<void>;
  isProcessing: boolean;
}

export const VoiceRecorder = ({ onRecordingComplete, isProcessing }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await onRecordingComplete(audioBlob, transcript);
        stream.getTracks().forEach(track => track.stop());
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript.trim());
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start(100);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
      <h2 className="text-2xl font-bold mb-4">Voice Payment</h2>
      
      {transcript && (
        <div className="bg-white/20 rounded p-4 mb-4">
          <p className="text-sm opacity-80">You said:</p>
          <p className="text-lg font-semibold">"{transcript}"</p>
        </div>
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          w-32 h-32 rounded-full flex items-center justify-center mx-auto
          transition-all duration-200 hover:scale-105
          ${isRecording 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-white text-blue-600'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isProcessing ? (
          <div className="animate-spin">⏳</div>
        ) : isRecording ? (
          <div className="text-4xl">⏹</div>
        ) : (
          <div className="text-4xl">🎤</div>
        )}
      </button>

      <p className="mt-4 text-sm opacity-90">
        {isProcessing 
          ? 'Processing your command...' 
          : isRecording 
          ? 'Listening... Click to stop' 
          : 'Click to start recording'
        }
      </p>

      <div className="mt-6 text-xs opacity-75">
        <p>Try saying: "Send 50 cedis to mama.family.eth"</p>
      </div>
    </div>
  );
};
