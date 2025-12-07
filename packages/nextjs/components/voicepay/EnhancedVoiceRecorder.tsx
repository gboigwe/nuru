'use client';

import { useVoiceRecognition } from '~/hooks/useVoiceRecognition';
import { VoiceWaveform } from './VoiceWaveform';

interface EnhancedVoiceRecorderProps {
  onTranscript: (transcript: string, confidence: number) => void;
  disabled?: boolean;
}

export const EnhancedVoiceRecorder = ({ onTranscript, disabled }: EnhancedVoiceRecorderProps) => {
  const {
    isRecording,
    isProcessing,
    transcript,
    confidence,
    error,
    method,
    startRecording,
    stopRecording,
    isSupported,
  } = useVoiceRecognition();

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  if (transcript && confidence > 0) {
    onTranscript(transcript, confidence);
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <VoiceWaveform isRecording={isRecording} audioLevel={isRecording ? 50 : 0} />

      <button
        onClick={isRecording ? handleStop : handleStart}
        disabled={disabled || isProcessing}
        className={`
          w-24 h-24 rounded-full shadow-lg transition-all duration-200 transform
          ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          focus:outline-none focus:ring-4 focus:ring-blue-200
        `}
      >
        <div className="text-white text-3xl">
          {isProcessing ? '🔄' : isRecording ? '⏹️' : '🎤'}
        </div>
      </button>

      <div className="text-center">
        {isRecording && <p className="text-red-600 font-bold animate-pulse">Recording...</p>}
        {isProcessing && <p className="text-orange-600 font-bold">Processing...</p>}
        {!isRecording && !isProcessing && (
          <p className="text-blue-600">
            {isSupported ? 'Tap to start (Web Speech)' : 'Tap to start (Whisper)'}
          </p>
        )}
      </div>

      {transcript && (
        <div className="bg-green-50 border border-green-200 rounded p-4 max-w-md">
          <p className="text-sm text-gray-600">Transcript ({method}):</p>
          <p className="font-semibold">{transcript}</p>
          <p className="text-xs text-gray-500">Confidence: {Math.round(confidence * 100)}%</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 max-w-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
