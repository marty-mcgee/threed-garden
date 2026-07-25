// src/components/test/TestLocalStorage.tsx
'use client';

import { useEffect } from 'react';
import { useTestStore } from '@/lib/stores/test-store';
import { Button } from '@/components/ui/button';

export function TestLocalStorage() {
  const { count, message, increment, setMessage, reset } = useTestStore();

  // Log state changes
  useEffect(() => {
    console.log('[Test] State changed:', { count, message });
  }, [count, message]);

  // Check localStorage on mount
  useEffect(() => {
    console.log('[Test] Component mounted');
    console.log('[Test] Current state:', { count, message });
    
    // Check if localStorage has the test key
    const stored = localStorage.getItem('test-storage');
    console.log('[Test] localStorage test-storage:', stored);
    
    // Try writing to localStorage directly
    try {
      localStorage.setItem('test-direct-write', 'Hello from test component');
      console.log('[Test] Direct localStorage write successful');
    } catch (error) {
      console.error('[Test] Direct localStorage write failed:', error);
    }
  }, []);

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h2 className="text-xl font-bold mb-4">LocalStorage Test</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Count: <span className="font-bold text-foreground">{count}</span></p>
          <p className="text-sm text-muted-foreground">Message: <span className="font-bold text-foreground">{message}</span></p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={increment}>Increment</Button>
          <Button onClick={() => setMessage('Updated at ' + new Date().toLocaleTimeString())}>
            Update Message
          </Button>
          <Button variant="outline" onClick={reset}>Reset</Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>Check the console for logs</p>
          <p>Check DevTools → Application → Storage → Local Storage for 'test-storage' key</p>
        </div>
      </div>
    </div>
  );
}