// src/lib/stores/music-player-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Track {
  id: number;
  title: string;
  artist?: string;
  albumId: number;
  albumTitle?: string;
  albumArt?: string;
  duration?: number;
  s3Url: string;
  fileUrl?: string;
  trackNumber?: number;
  status?: string;
  userId?: string | null;
  lyrics?: string | null;
  metadata?: any;
  playCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PlayerState {
  // Current playback
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  
  // Queue management
  queue: Track[];
  currentIndex: number;
  
  // History (for recently played)
  history: Track[];
  
  // Actions
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  playAlbum: (tracks: Track[], startIndex?: number) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  addToHistory: (track: Track) => void;
  setCurrentTrack: (track: Track | null) => void;
  resetPlayer: () => void;
  debug: () => void;
}

type PersistedPlayerState = Pick<
  PlayerState,
  'currentTrack' | 'queue' | 'currentIndex' | 'volume' | 'isMuted' | 'history'
>;

// ✅ Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// ✅ Debounce helper
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

export const useMusicPlayer = create<PlayerState>()(
  persist<PlayerState, [], [], PersistedPlayerState>(
    (set, get) => {
      console.log('🔵 [Store] Zustand store initialized');
      
      // ✅ Debounced save function (only saves when state actually changes)
      const debouncedSave = debounce(() => {
        console.log('💾 [Store] Debounced save triggered');
        // The persist middleware will handle the actual save
        // We just need to trigger a state update
        const state = get();
        console.log('💾 [Store] State to save:', {
          currentTrack: state.currentTrack?.title || 'null',
          queueLength: state.queue.length,
        });
      }, 500); // ✅ Save at most once every 500ms

      return {
        // Initial state
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        volume: 0.8,
        isMuted: false,
        queue: [],
        currentIndex: -1,
        history: [],

        debug: () => {
          const state = get();
          console.log('🐛 [Store] Current state:', {
            currentTrack: state.currentTrack?.title || 'null',
            isPlaying: state.isPlaying,
            currentTime: state.currentTime,
            queueLength: state.queue.length,
            currentIndex: state.currentIndex,
            historyLength: state.history.length,
          });
          if (isBrowser) {
            try {
              const stored = localStorage.getItem('music-player-storage');
              console.log('🐛 [Store] localStorage:', stored ? JSON.parse(stored) : 'null');
            } catch (error) {
              console.error('🐛 [Store] localStorage error:', error);
            }
          }
        },

        // Reset player state
        resetPlayer: () => {
          console.log('🔄 [Store] resetPlayer called');
          set({ 
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            queue: [],
            currentIndex: -1,
          });
          debouncedSave();
        },

        // Play a specific track
        playTrack: (track: Track) => {
          console.log('▶️ [Store] playTrack called:', track.title);
          
          set({ 
            queue: [track], 
            currentIndex: 0, 
            currentTrack: track, 
            isPlaying: true,
            currentTime: 0 
          });
          
          get().addToHistory(track);
          debouncedSave();
        },

        togglePlayPause: () => {
          console.log('⏯️ [Store] togglePlayPause called');
          set((state) => ({ isPlaying: !state.isPlaying }));
          debouncedSave();
        },

        setPlaying: (playing: boolean) => {
          set({ isPlaying: playing });
          debouncedSave();
        },

        // ✅ CRITICAL: setCurrentTime does NOT trigger a save
        setCurrentTime: (time: number) => {
          set({ currentTime: time });
          // ❌ No save here - prevents constant localStorage writes
        },

        setVolume: (volume: number) => {
          set({ volume, isMuted: volume === 0 });
          debouncedSave();
        },

        toggleMute: () => {
          set((state) => ({ isMuted: !state.isMuted }));
          debouncedSave();
        },

        setCurrentTrack: (track: Track | null) => {
          set({ currentTrack: track });
          debouncedSave();
        },

        nextTrack: () => {
          const { queue, currentIndex } = get();
          if (queue.length === 0) return;
          
          const nextIndex = (currentIndex + 1) % queue.length;
          const nextTrack = queue[nextIndex];
          
          set({ 
            currentIndex: nextIndex, 
            currentTrack: nextTrack, 
            isPlaying: true,
            currentTime: 0 
          });
          
          get().addToHistory(nextTrack);
          debouncedSave();
        },

        previousTrack: () => {
          const { queue, currentIndex, currentTime } = get();
          if (queue.length === 0) return;
          
          if (currentTime > 3) {
            set({ currentTime: 0 });
            return;
          }
          
          const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
          const prevTrack = queue[prevIndex];
          
          set({ 
            currentIndex: prevIndex, 
            currentTrack: prevTrack, 
            isPlaying: true,
            currentTime: 0 
          });
          
          get().addToHistory(prevTrack);
          debouncedSave();
        },

        addToQueue: (track: Track) => {
          set((state) => ({ queue: [...state.queue, track] }));
          debouncedSave();
        },

        playAlbum: (tracks: Track[], startIndex: number = 0) => {
          if (tracks.length === 0) {
            console.warn('⚠️ [Store] No tracks to play');
            return;
          }
          
          const safeStartIndex = Math.min(startIndex, tracks.length - 1);
          const track = tracks[safeStartIndex];
          
          console.log('📀 [Store] Playing album with', tracks.length, 'tracks, starting at:', track.title);
          
          set({ 
            queue: tracks, 
            currentIndex: safeStartIndex, 
            currentTrack: track,
            isPlaying: true,
            currentTime: 0 
          });
          
          get().addToHistory(track);
          debouncedSave();
        },

        clearQueue: () => {
          set({ queue: [], currentIndex: -1, currentTrack: null, isPlaying: false });
          debouncedSave();
        },

        removeFromQueue: (index: number) => {
          set((state) => {
            const newQueue = [...state.queue];
            newQueue.splice(index, 1);
            
            let newCurrentIndex = state.currentIndex;
            if (index === state.currentIndex) {
              newCurrentIndex = -1;
              if (newQueue.length === 0) {
                return { queue: newQueue, currentIndex: -1, currentTrack: null, isPlaying: false };
              }
              const nextTrack = newQueue[Math.min(index, newQueue.length - 1)];
              return { 
                queue: newQueue, 
                currentIndex: Math.min(index, newQueue.length - 1), 
                currentTrack: nextTrack,
                isPlaying: true 
              };
            } else if (index < state.currentIndex) {
              newCurrentIndex = state.currentIndex - 1;
            }
            
            return { queue: newQueue, currentIndex: newCurrentIndex };
          });
          debouncedSave();
        },

        addToHistory: (track: Track) => {
          set((state) => ({
            history: [track, ...state.history.filter((t) => t.id !== track.id)].slice(0, 50)
          }));
          debouncedSave();
        },
      };
    },
    {
      name: 'music-player-storage',
      
      // ✅ Storage with SSR guards
      storage: {
        getItem: (name) => {
          if (!isBrowser) {
            return null;
          }
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('❌ [Storage] GET error:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          if (!isBrowser) {
            return;
          }
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ [Storage] SET error:', error);
          }
        },
        removeItem: (name) => {
          if (!isBrowser) {
            return;
          }
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('❌ [Storage] REMOVE error:', error);
          }
        },
      },
      
      // ✅ CRITICAL: Exclude currentTime from persisted state
      partialize: (state) => {
        return {
          currentTrack: state.currentTrack,
          queue: state.queue,
          currentIndex: state.currentIndex,
          volume: state.volume,
          isMuted: state.isMuted,
          history: state.history,
          // ❌ currentTime is NOT persisted
          // ❌ isPlaying is NOT persisted (starts paused on page load)
        };
      },
      
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('❌ [Storage] Rehydration error:', error);
          } else if (state) {
            console.log('✅ [Storage] Rehydration complete:', {
              currentTrack: state.currentTrack?.title || 'null',
              queueLength: state.queue.length,
            });
          }
        };
      },
    }
  )
);

// ✅ Helper to check localStorage directly
export const checkStorage = () => {
  if (!isBrowser) return null;
  try {
    const data = localStorage.getItem('music-player-storage');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ [Storage] Direct check error:', error);
    return null;
  }
};
