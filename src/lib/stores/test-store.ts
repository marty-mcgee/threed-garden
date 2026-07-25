// src/lib/stores/test-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TestState {
  count: number;
  message: string;
  increment: () => void;
  setMessage: (msg: string) => void;
  reset: () => void;
}

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      count: 0,
      message: 'Hello World',
      increment: () => set((state) => ({ count: state.count + 1 })),
      setMessage: (msg: string) => set({ message: msg }),
      reset: () => set({ count: 0, message: 'Hello World' }),
    }),
    {
      name: 'test-storage', // unique name for localStorage
    }
  )
);