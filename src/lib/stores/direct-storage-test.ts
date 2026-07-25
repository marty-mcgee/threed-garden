// src/lib/stores/direct-storage-test.ts
import { create } from 'zustand';

interface TestState {
  count: number;
  message: string;
  increment: () => void;
  setMessage: (msg: string) => void;
  reset: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  clearStorage: () => void;
}

const STORAGE_KEY = 'direct-test-storage';

// ✅ Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// ✅ Direct localStorage functions with SSR guard
export const directStorage = {
  save: (state: any) => {
    if (!isBrowser) {
      console.log('ℹ️ [DirectStorage] Skipping save (server-side)');
      return false;
    }
    try {
      console.log('💾 [DirectStorage] Saving to localStorage...');
      const data = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, data);
      console.log('✅ [DirectStorage] Saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ [DirectStorage] Save failed:', error);
      return false;
    }
  },
  
  load: () => {
    if (!isBrowser) {
      console.log('ℹ️ [DirectStorage] Skipping load (server-side)');
      return null;
    }
    try {
      console.log('📂 [DirectStorage] Loading from localStorage...');
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        console.log('✅ [DirectStorage] Loaded successfully:', data);
        return JSON.parse(data);
      } else {
        console.log('ℹ️ [DirectStorage] No data found');
        return null;
      }
    } catch (error) {
      console.error('❌ [DirectStorage] Load failed:', error);
      return null;
    }
  },
  
  clear: () => {
    if (!isBrowser) {
      console.log('ℹ️ [DirectStorage] Skipping clear (server-side)');
      return false;
    }
    try {
      console.log('🗑️ [DirectStorage] Clearing localStorage...');
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ [DirectStorage] Cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ [DirectStorage] Clear failed:', error);
      return false;
    }
  },
  
  test: () => {
    if (!isBrowser) {
      console.log('ℹ️ [DirectStorage] Skipping test (server-side)');
      return false;
    }
    try {
      console.log('🧪 [DirectStorage] Testing localStorage...');
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      console.log('✅ [DirectStorage] localStorage is working!');
      return true;
    } catch (error) {
      console.error('❌ [DirectStorage] localStorage is NOT working:', error);
      return false;
    }
  }
};

// ✅ Create a Zustand store WITHOUT persist middleware
export const useDirectTestStore = create<TestState>((set, get) => {
  console.log('🔵 [DirectStore] Store initialized');
  
  // ✅ Load initial state from localStorage (only in browser)
  const savedState = isBrowser ? directStorage.load() : null;
  
  const initialState = savedState || {
    count: 0,
    message: 'Hello World',
  };
  
  console.log('📦 [DirectStore] Initial state:', initialState);

  return {
    ...initialState,
    
    increment: () => {
      console.log('➕ [DirectStore] increment called');
      set((state) => ({ count: state.count + 1 }));
      setTimeout(() => get().saveToStorage(), 10);
    },
    
    setMessage: (msg: string) => {
      console.log('📝 [DirectStore] setMessage called:', msg);
      set({ message: msg });
      setTimeout(() => get().saveToStorage(), 10);
    },
    
    reset: () => {
      console.log('🔄 [DirectStore] reset called');
      set({ count: 0, message: 'Hello World' });
      setTimeout(() => get().saveToStorage(), 10);
    },
    
    saveToStorage: () => {
      console.log('💾 [DirectStore] saveToStorage called');
      const state = get();
      const stateToSave = {
        count: state.count,
        message: state.message,
      };
      directStorage.save(stateToSave);
    },
    
    loadFromStorage: () => {
      console.log('📂 [DirectStore] loadFromStorage called');
      const saved = directStorage.load();
      if (saved) {
        set({ count: saved.count || 0, message: saved.message || 'Hello World' });
      }
    },
    
    clearStorage: () => {
      console.log('🗑️ [DirectStore] clearStorage called');
      directStorage.clear();
      set({ count: 0, message: 'Hello World' });
    },
  };
});