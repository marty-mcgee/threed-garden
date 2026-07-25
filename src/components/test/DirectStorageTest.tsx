// src/components/test/DirectStorageTest.tsx
'use client';

import { useEffect } from 'react';
import { useDirectTestStore, directStorage } from '@/lib/stores/direct-storage-test';
import { Button } from '@/components/ui/button';

export function DirectStorageTest() {
  const { count, message, increment, setMessage, reset, saveToStorage, loadFromStorage, clearStorage } = useDirectTestStore();

  // ✅ Run tests on mount
  useEffect(() => {
    console.log('🧪 [Test] Component mounted');
    
    // ✅ Test 1: Check if localStorage is available
    console.log('🧪 [Test] Running localStorage test...');
    const isWorking = directStorage.test();
    
    // ✅ Test 2: Check current state
    console.log('🧪 [Test] Current state:', { count, message });
    
    // ✅ Test 3: Try direct write
    console.log('🧪 [Test] Trying direct write...');
    try {
      localStorage.setItem('direct-test', 'works');
      const result = localStorage.getItem('direct-test');
      console.log('🧪 [Test] Direct write result:', result);
      localStorage.removeItem('direct-test');
    } catch (error) {
      console.error('🧪 [Test] Direct write failed:', error);
    }
  }, []);

  // ✅ Log state changes
  useEffect(() => {
    console.log('📊 [Test] State changed:', { count, message });
  }, [count, message]);

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <h2 className="text-xl font-bold">🧪 Direct Storage Test</h2>
      
      <div className="space-y-2">
        <p className="text-sm">
          Count: <span className="font-bold">{count}</span>
        </p>
        <p className="text-sm">
          Message: <span className="font-bold">{message}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={increment}>Increment</Button>
        <Button onClick={() => setMessage('Updated at ' + new Date().toLocaleTimeString())}>
          Update Message
        </Button>
        <Button variant="outline" onClick={reset}>Reset</Button>
        <Button variant="outline" onClick={saveToStorage}>💾 Save</Button>
        <Button variant="outline" onClick={loadFromStorage}>📂 Load</Button>
        <Button variant="destructive" onClick={clearStorage}>🗑️ Clear</Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 mt-2">
        <p>📍 Check the console for detailed logs</p>
        <p>📍 Check DevTools → Application → Storage → Local Storage</p>
        <p>📍 Key: <code className="bg-muted px-1 rounded">direct-test-storage</code></p>
      </div>
    </div>
  );
}