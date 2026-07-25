'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  className?: string;
  height?: number;
}

export function WaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime = 0,
  duration = 0,
  className,
  height = 100,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);

  // Generate waveform pattern based on audio URL (deterministic)
  useEffect(() => {
    if (!audioUrl) return;

    // Create a unique but consistent waveform based on the URL
    const generateConsistentWaveform = () => {
      const bars = 60;
      const waveform: number[] = [];
      
      // Use the URL to create a deterministic pattern
      let hash = 0;
      for (let i = 0; i < audioUrl.length; i++) {
        hash = ((hash << 5) - hash) + audioUrl.charCodeAt(i);
        hash |= 0;
      }
      
      // Generate waveform that looks like real audio
      for (let i = 0; i < bars; i++) {
        // Create a realistic-looking waveform pattern
        const position = i / bars;
        // Bell curve shape with some randomness based on hash
        const bellCurve = Math.sin(position * Math.PI);
        const randomFactor = ((hash >> (i % 20)) & 0xFF) / 255;
        const value = Math.max(0.15, Math.min(0.85, bellCurve * 0.6 + randomFactor * 0.4));
        waveform.push(value);
      }
      
      setWaveformData(waveform);
    };
    
    generateConsistentWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get container width
    const container = canvas.parentElement;
    const width = container?.clientWidth || 600;
    const barCount = waveformData.length;
    const barWidth = Math.max(2, (width / barCount) - 2);
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate progress (which bars have been played)
    const progressPercent = duration > 0 ? currentTime / duration : 0;
    const playedBarCount = Math.floor(progressPercent * barCount);
    
    // Draw each bar
    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.max(3, waveformData[i] * height);
      const x = i * (barWidth + 2);
      const y = (height - barHeight) / 2;
      
      // Color based on whether this portion has been played
      if (i <= playedBarCount) {
        // Played portion - gradient purple
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#a855f7');
        ctx.fillStyle = gradient;
      } else {
        // Unplayed portion - dark gray
        ctx.fillStyle = '#374151';
      }
      
      // Draw rounded rectangle
      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 4);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight - radius);
      ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
      ctx.lineTo(x + radius, y + barHeight);
      ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }
  }, [waveformData, currentTime, duration, height]);

  if (!waveformData) {
    return (
      <div className={cn("flex items-center justify-center bg-black/20 rounded-lg", className)} style={{ height }}>
        <div className="flex gap-1">
          <div className="w-1 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-4 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-black/20 rounded-lg overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px`, display: 'block' }}
      />
    </div>
  );
}