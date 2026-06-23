// src/components/dashboard/CHPLiveIncidents.tsx
'use client';

import { useState } from 'react';

export default function CHPLiveIncidents() {
  const [isPolling, setIsPolling] = useState(false);

  const pollData = async () => {
    setIsPolling(true);
    try {
      // TODO: Implement CHP CAD poller
      // const response = await fetch('/api/chp-cad/poll?action=poll');
      alert('CHP Live Incidents - Coming soon! This feature is currently being developed.');
    } catch (error) {
      alert('Poll failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <div>
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CHP Live Incidents</h2>
          <p className="text-sm text-gray-500">Real-time incidents from CHP CAD system</p>
        </div>
        <button
          onClick={pollData}
          disabled={isPolling}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isPolling ? 'Polling...' : 'Refresh Data'}
        </button>
      </div>
      <div className="p-12 text-center text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-semibold">Coming Soon</p>
        <p className="text-sm mt-2">CHP Live Incidents integration is currently being developed</p>
      </div>
    </div>
  );
}
