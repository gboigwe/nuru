'use client';

import { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isRecording: boolean;
  audioLevel?: number;
}

export const VoiceWaveform = ({ isRecording, audioLevel = 0 }: VoiceWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isRecording) {
        const bars = 40;
        const barWidth = width / bars;
        const centerY = height / 2;

        for (let i = 0; i < bars; i++) {
          const randomHeight = Math.random() * (audioLevel || 20) + 10;
          const x = i * barWidth;
          const barHeight = randomHeight * (height / 100);

          ctx.fillStyle = '#12B76A';
          ctx.fillRect(x, centerY - barHeight / 2, barWidth - 2, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 rounded-lg bg-gray-50"
    />
  );
};
