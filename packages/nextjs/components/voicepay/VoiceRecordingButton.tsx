"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecognitionResult, voiceRecognitionPipeline } from "../../services/voice/VoiceRecognitionPipeline";

interface VoiceRecordingButtonProps {
  onResult: (result: VoiceRecognitionResult) => void;
  onStateChange: (state: "idle" | "recording" | "processing") => void;
  disabled?: boolean;
}

export const VoiceRecordingButton: React.FC<VoiceRecordingButtonProps> = ({
  onResult,
  onStateChange,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false); // Keep ref for callbacks
  const onResultRef = useRef(onResult);
  const onStateChangeRef = useRef(onStateChange);
  const maxRecordingTime = 15000; // 15 seconds max

  // Sync refs with props and state
  useEffect(() => {
    isRecordingRef.current = isRecording;
    onResultRef.current = onResult;
    onStateChangeRef.current = onStateChange;
  }, [isRecording, onResult, onStateChange]);

  const startRecording = useCallback(async () => {
    console.log("🔥 startRecording called!");

    if (disabled || isRecording || isProcessing) {
      console.log(
        "❌ Cannot start recording - disabled:",
        disabled,
        "isRecording:",
        isRecording,
        "isProcessing:",
        isProcessing,
      );
      return;
    }

    try {
      console.log("✅ Setting isRecording to TRUE...");
      setIsRecording(true);
      onStateChangeRef.current("recording");
      console.log("✅ Recording state set to true - UI should show STOP button now!");

      // Request microphone permission first if needed
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        if (permissionError instanceof Error && permissionError.name === "NotAllowedError") {
          throw new Error(
            "Microphone permission is required for voice payments. Please allow microphone access and try again.",
          );
        }
        throw permissionError;
      }

      // Start voice recognition with manual control (no auto-stop)
      console.log("Calling startVoiceRecognition...");
      await voiceRecognitionPipeline.startVoiceRecognition({
        enableVAD: false, // Disable auto-stop on silence for manual control
        maxDuration: maxRecordingTime,
      });
      console.log("startVoiceRecognition completed successfully");

      // Set maximum recording time timeout
      recordingTimeoutRef.current = setTimeout(() => {
        console.log("Recording timeout reached, auto-stopping...");
        if (isRecordingRef.current) {
          stopRecording();
        }
      }, maxRecordingTime);
    } catch (error) {
      console.error("Failed to start recording:", error);
      console.log("Resetting recording state due to error");
      setIsRecording(false);
      onStateChangeRef.current("idle");

      onResultRef.current({
        success: false,
        error: error instanceof Error ? error.message : "Failed to start recording",
        processingTime: 0,
      });
    }
  }, [disabled]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) {
      console.log("Cannot stop recording - not currently recording");
      return;
    }

    try {
      console.log("Stopping voice recording...");
      setIsRecording(false);
      setIsProcessing(true);
      onStateChangeRef.current("processing");

      // Clear recording timeout
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Stop voice recognition and get result
      const result = await voiceRecognitionPipeline.stopVoiceRecognition();
      console.log("Voice recognition stopped, processing result...");

      setIsProcessing(false);
      onStateChangeRef.current("idle");

      onResultRef.current(result);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
      setIsProcessing(false);
      onStateChangeRef.current("idle");

      onResultRef.current({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process recording",
        processingTime: 0,
      });
    }
  }, []);

  const startRecordingStable = useCallback(() => {
    if (disabled || isRecordingRef.current || isProcessing) {
      console.log(
        "Cannot start recording - disabled:",
        disabled,
        "isRecording:",
        isRecordingRef.current,
        "isProcessing:",
        isProcessing,
      );
      return;
    }
    startRecording();
  }, [disabled, isProcessing, startRecording]);

  const stopRecordingStable = useCallback(() => {
    if (!isRecordingRef.current) {
      console.log("Cannot stop recording - not currently recording");
      return;
    }
    stopRecording();
  }, [stopRecording]);

  const handlePress = useCallback(() => {
    console.log("Button pressed - current state: isRecording:", isRecordingRef.current, "isProcessing:", isProcessing);

    if (isRecordingRef.current) {
      stopRecordingStable();
    } else if (!isProcessing) {
      startRecordingStable();
    }
  }, [isProcessing, startRecordingStable, stopRecordingStable]);

  // Debug: log current state
  console.log("VoiceRecordingButton render - isRecording:", isRecording, "isProcessing:", isProcessing);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main Recording Button */}
      <button
        onClick={isRecording ? undefined : handlePress}
        disabled={disabled || isProcessing || isRecording}
        className={`
          w-24 h-24 rounded-full shadow-lg transition-all duration-200 transform
          ${
            isRecording
              ? "bg-gray-400 cursor-not-allowed"
              : isProcessing
                ? "bg-orange-500 animate-spin"
                : disabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95"
          }
          focus:outline-none focus:ring-4 
          ${isRecording ? "focus:ring-red-200" : "focus:ring-blue-200"}
        `}
      >
        <div className="text-white text-3xl">{isProcessing ? "🔄" : isRecording ? "⏹️" : "🎤"}</div>
        {/* Debug indicator */}
        <div className="text-xs text-black mt-1">{isRecording ? "STOP" : "START"}</div>
      </button>

      {/* STOP BUTTON - Only shows when recording */}
      {isRecording && (
        <button
          onClick={stopRecordingStable}
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-200 animate-pulse"
        >
          <div className="text-white text-2xl">⏹️</div>
          <div className="text-white text-xs font-bold">STOP</div>
        </button>
      )}

      {/* Status Text */}
      <div className="text-center">
        {isRecording && (
          <div className="space-y-2">
            <p className="text-xl font-bold text-red-600 animate-pulse">🔴 Recording...</p>
            <p className="text-sm text-red-700 font-medium">Speak now, then TAP STOP ⏹️ to process</p>
            <p className="text-xs text-gray-500">Auto-stops after 15 seconds</p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <p className="text-xl font-bold text-orange-600">🔄 Processing...</p>
            <p className="text-sm text-orange-700 font-medium">Understanding your voice command</p>
            <p className="text-xs text-gray-500">This may take a few seconds</p>
          </div>
        )}

        {!isRecording && !isProcessing && (
          <div className="space-y-2">
            <p className="text-xl font-bold text-blue-600">🎤 Tap to Start</p>
            <p className="text-sm text-blue-700 font-medium">1. Tap to start recording</p>
            <p className="text-sm text-blue-700 font-medium">2. Speak your payment command</p>
            <p className="text-sm text-blue-700 font-medium">3. Tap ⏹️ to stop and process</p>
          </div>
        )}
      </div>

      {/* Recording Instructions */}
      {!isRecording && !isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4 max-w-xs text-center">
          <p className="text-xs text-blue-700 mb-2 font-medium">Voice Command Examples:</p>
          <div className="space-y-1 text-xs text-blue-600">
            <p>"Send 50 cedis to mama.eth"</p>
            <p>"Transfer 100 USDC to kofi.eth"</p>
            <p>"Pay friend.eth 25 dollars"</p>
          </div>
        </div>
      )}
    </div>
  );
};
