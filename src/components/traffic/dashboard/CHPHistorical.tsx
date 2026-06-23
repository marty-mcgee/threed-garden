// src/components/dashboard/CHPHistorical.tsx
'use client';

import { useState } from 'react';

export default function CHPHistorical() {
  const [isPolling, setIsPolling] = useState(false);

  const pollData = async () => {
    setIsPolling(true);
    try {
      // TODO: Implement CHP Historical poller
      // const response = await fetch('/api/historical/chp?action=poll');
      alert('CHP Historical Collisions - Coming soon! This feature is currently being developed.');
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
          <h2 className="text-lg font-semibold text-gray-900">CHP Historical Collisions</h2>
          <p className="text-sm text-gray-500">Historical collision records from CHP CCRS via data.ca.gov</p>
        </div>
        <button
          onClick={pollData}
          disabled={isPolling}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isPolling ? 'Polling...' : 'Refresh Data'}
        </button>
      </div>
      <div className="p-12 text-center text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-semibold">Coming Soon</p>
        <p className="text-sm mt-2">CHP Historical Collisions integration is currently being developed</p>
      </div>
    </div>
  );
}
