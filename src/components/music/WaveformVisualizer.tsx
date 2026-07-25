// src/components/music/WaveformVisualizer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  height?: number;
}

export function WaveformVisualizer({
  audioUrl,
  isPlaying,
  onTimeUpdate,
  className,
  height = 48,
}: WaveformVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initWaveSurfer = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!containerRef.current) {
        return;
      }

      if (!audioUrl) {
        setIsLoading(false);
        setError('No audio URL');
        return;
      }

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      setIsLoading(true);
      setIsReady(false);
      setError(null);

      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;

        // ✅ Thin bars with vibrant colors
        const wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          // ✅ Wave color - visible in both modes
          waveColor: 'rgba(99, 102, 241, 0.3)',
          // ✅ Progress color - bright and vibrant
          progressColor: 'rgba(99, 102, 241, 0.8)',
          cursorColor: 'rgba(255, 255, 255, 0.5)',
          // ✅ Thin bars for detailed waveform
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: height,
          normalize: true,
          responsive: true,
          hideScrollbar: true,
          interact: true,
          backend: 'WebAudio',
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          if (isMounted) {
            setIsLoading(false);
            setIsReady(true);
            if (isPlaying) {
              wavesurfer.play();
            }
          }
        });

        wavesurfer.on('audioprocess', () => {
          if (isMounted && onTimeUpdate) {
            onTimeUpdate(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('seek', () => {
          if (isMounted && onTimeUpdate) {
            onTimeUpdate(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('loading', (percent: number) => {
          if (isMounted) {
            setIsLoading(percent < 100);
          }
        });

        wavesurfer.on('error', (err: any) => {
          console.error('[Waveform] ❌ ERROR:', err);
          if (isMounted) {
            setError(err.message || 'Failed to load audio');
            setIsLoading(false);
          }
        });

        wavesurfer.load(audioUrl);

      } catch (error) {
        console.error('[Waveform] ❌ Init error:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize');
          setIsLoading(false);
        }
      }
    };

    initWaveSurfer();

    return () => {
      isMounted = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, height, onTimeUpdate]);

  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isReady]);

  return (
    <div 
      className={cn(
        "relative w-full rounded-md overflow-hidden",
        "bg-muted/5",
        className
      )} 
      style={{ height }}
    >
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive text-xs">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}