import { create } from 'zustand';
import { NormalizedFeedItem } from '../services/feedService';

interface PlayerState {
  currentMedia: NormalizedFeedItem | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playbackRate: number;
  isMinimized: boolean;
  
  // Actions
  setMedia: (item: NormalizedFeedItem) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setMinimized: (minimized: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentMedia: null,
  isPlaying: false,
  progress: 0,
  volume: 1,
  playbackRate: 1,
  isMinimized: false,

  setMedia: (item) => set({ currentMedia: item, isPlaying: true, progress: 0 }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
  reset: () => set({ currentMedia: null, isPlaying: false, progress: 0 }),
}));
