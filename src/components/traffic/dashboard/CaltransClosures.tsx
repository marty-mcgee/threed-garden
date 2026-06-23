// src/components/dashboard/CaltransClosures.tsx
'use client';

import { useEffect, useState } from 'react';

interface Closure {
  closure_id: number;
  route: string;
  district: number;
  closure_type: string;
  status: string;
  end_date: string;
  description: string;
}

export default function CaltransClosures() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/caltrans/closures/raw');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setClosures(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch closures:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollData = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/caltrans/poll?action=poll');
      const data = await response.json();
      if (data.success) {
        alert(`Caltrans poll completed! Found ${data.stats?.totalClosures || 0} closures.`);
        await fetchData();
      } else {
        alert('Caltrans poll failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Poll failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeClosures = closures.filter(c => c.status === 'active');

  return (
    <div>
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Caltrans Lane Closures</h2>
          <p className="text-sm text-gray-500">Real-time lane closures from Caltrans CWWP2 API</p>
        </div>
        <button
          onClick={pollData}
          disabled={isPolling}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isPolling ? 'Polling...' : 'Refresh Data'}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading closures...</p>
        </div>
      ) : activeClosures.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">No active closures found</p>
          <p className="text-sm mt-2">Try polling during weekday business hours (Tuesday-Thursday, 10 AM - 2 PM PT)</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeClosures.slice(0, 100).map((closure) => (
                <tr key={closure.closure_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {closure.route || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {closure.district || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      {closure.closure_type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {closure.end_date ? new Date(closure.end_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    <div className="truncate" title={closure.description || ''}>
                      {closure.description?.substring(0, 100) || 'No description'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <span>Data source: Caltrans CWWP2 API</span>
          <span>Showing {activeClosures.length} active closures</span>
        </div>
      </div>
    </div>
  );
}
