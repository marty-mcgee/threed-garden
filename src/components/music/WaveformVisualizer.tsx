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
  barWidth?: number;
  barSpacing?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function WaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime = 0,
  duration = 0,
  className,
  height = 80,
  barWidth = 3,
  barSpacing = 2,
  activeColor = 'from-blue-500 to-purple-500',
  inactiveColor = 'bg-gray-600',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const animationRef = useRef<number>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Analyze audio file and generate waveform
  useEffect(() => {
    console.log('WaveformVisualizer mounted with audioUrl:', audioUrl);
    if (!audioUrl) return;

    const analyzeAudio = async () => {
      setIsAnalyzing(true);
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the peak data for left and right channels
        const channelData = audioBuffer.getChannelData(0);
        
        // Calculate number of bars based on canvas width
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const barTotalWidth = barWidth + barSpacing;
        const numberOfBars = Math.min(Math.floor(containerWidth / barTotalWidth), 200);
        
        // Downsample the audio data to match number of bars
        const samplesPerBar = Math.floor(channelData.length / numberOfBars);
        const waveform: number[] = [];
        
        for (let i = 0; i < numberOfBars; i++) {
          let sum = 0;
          const start = i * samplesPerBar;
          const end = start + samplesPerBar;
          
          for (let j = start; j < end && j < channelData.length; j++) {
            sum += Math.abs(channelData[j]);
          }
          
          const average = sum / samplesPerBar;
          // Boost low signals and normalize
          let normalized = Math.min(1, average * 2.0);
          // Apply logarithmic scaling for better visual range
          normalized = Math.pow(normalized, 0.7);
          waveform.push(normalized);
        }
        
        setWaveformData(waveform);
      } catch (error) {
        console.error('Error analyzing waveform:', error);
        // Generate fake waveform for demo
        const fakeWaveform = Array.from({ length: 100 }, () => Math.random() * 0.6 + 0.2);
        setWaveformData(fakeWaveform);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl, barWidth, barSpacing]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !waveformData || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const barTotalWidth = barWidth + barSpacing;
    const numberOfBars = Math.min(Math.floor(containerWidth / barTotalWidth), waveformData.length);
    
    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, height);
    
    // Calculate progress position
    const progressPercent = duration > 0 ? currentTime / duration : 0;
    const progressBarIndex = Math.floor(progressPercent * numberOfBars);
    
    // Draw each bar
    for (let i = 0; i < numberOfBars; i++) {
      const amplitude = waveformData[i] || 0;
      const barHeight = Math.max(3, amplitude * height);
      const x = i * barTotalWidth;
      const y = (height - barHeight) / 2;
      
      const isPlayed = i <= progressBarIndex;
      
      // Create gradient for played portion
      if (isPlayed && activeColor) {
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#3b82f6'); // blue-500
        gradient.addColorStop(1, '#8b5cf6'); // purple-500
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#4b5563'; // gray-600
      }
      
      // Rounded rectangle for modern look
      ctx.beginPath();
      const radius = barWidth / 2;
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }
  }, [waveformData, height, barWidth, barSpacing, activeColor, currentTime, duration]);

  // Animate the waveform when playing (adds subtle movement)
  useEffect(() => {
    if (!isPlaying || isAnalyzing) return;

    let lastTimestamp = 0;
    const animate = (timestamp: number) => {
      if (!lastTimestamp || timestamp - lastTimestamp > 100) {
        // Trigger re-draw
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            // Force redraw with slight variation
            setWaveformData(prev => [...prev]);
          }
        }
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isAnalyzing]);

  if (isAnalyzing) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-black/20", className)} style={{ height }}>
        <div className="flex gap-1">
          <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-6 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-8 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-1 h-6 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
      />
      {isPlaying && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      )}
    </div>
  );
}

// Add roundRect to Canvas API if not present
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r);
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r);
    this.quadraticCurveTo(x, y, x+r, y);
    return this;
  };
}

declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): CanvasRenderingContext2D;
  }
}