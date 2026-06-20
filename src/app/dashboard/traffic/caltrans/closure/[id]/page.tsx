// app/closure/[id]/page.tsx (Production Clean Version)
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Closure {
  closure_id: number;
  source_id: string;
  district: number;
  route: string;
  direction: string;
  closure_type: string;
  closure_subtype: string;
  lanes_affected: string;
  lanes_closed: string;
  lane_configuration: string;
  description: string;
  location_description: string;
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  city: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  times_seen: number;
  first_seen: string;
  last_seen: string;
  created_at: string;
  raw_data: any;
}

interface RelatedClosure {
  closure_id: number;
  route: string;
  closure_type: string;
  status: string;
  end_date: string;
  district: number;
}

// Helper functions
const formatCoordinate = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 'N/A' : num.toFixed(6);
};

const formatNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? 'N/A' : num.toString();
};

export default function ClosureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [closure, setClosure] = useState<Closure | null>(null);
  const [related, setRelated] = useState<RelatedClosure[]>([]);
  const [historical, setHistorical] = useState<RelatedClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    async function fetchClosure() {
      if (!id) {
        setError('No closure ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/caltrans/closures/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Failed to load closure`);
        }
        
        if (data.success) {
          setClosure(data.closure);
          setRelated(data.related || []);
          setHistorical(data.historical || []);
        } else {
          throw new Error(data.error || 'Failed to fetch closure');
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClosure();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type?.includes('Closure')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">{type}</span>;
    } else if (type?.includes('Work')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{type}</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{type || 'Unknown'}</span>;
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return 'N/A';
    if (time && time !== '00:00' && time !== '00:00:00') {
      return new Date(`${date}T${time}`).toLocaleString();
    }
    return new Date(date).toLocaleDateString();
  };

  // Add helper functions at the top of your component

  // Safely format a coordinate (latitude/longitude)
  const formatCoordinate = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'N/A';
    return num.toFixed(6);
  };

  // Safely format a number with optional decimal places
  const formatNumber = (value: string | number | null | undefined, decimals: number = 0): string => {
    if (value === null || value === undefined) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Safely format a timestamp
  const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading closure details...</div>
        </div>
      </div>
    );
  }

  if (error || !closure) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Closure</h2>
            <p className="text-red-500 mb-4">{error || 'Closure not found'}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of your clean production component JSX here...
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep your existing production JSX */}
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Closure Details: {closure.route}
                </h1>
                <p className="text-gray-500 text-sm">
                  District {closure.district} • ID: {closure.closure_id}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Status Information</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <div className="mt-1">{getStatusBadge(closure.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Times Seen</p>
                    <p className="text-lg font-semibold text-gray-900">{formatNumber(closure.times_seen)} times</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">First Reported</p>
                    <p className="text-sm text-gray-900">{new Date(closure.first_seen).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">{new Date(closure.last_seen).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Location Details</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="text-lg font-semibold text-gray-900">{closure.route}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Direction</p>
                    <p className="text-lg font-semibold text-gray-900">{closure.direction || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">District</p>
                    <p className="text-lg font-semibold text-gray-900">{closure.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">County</p>
                    <p className="text-lg font-semibold text-gray-900">{closure.county || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-lg font-semibold text-gray-900">{closure.city || 'N/A'}</p>
                  </div>
                  {closure.latitude && closure.longitude && (
                    <div>
                      <p className="text-sm text-gray-500">Coordinates</p>
                      <p className="text-sm text-gray-900">
                        {formatCoordinate(closure.latitude)}, {formatCoordinate(closure.longitude)}
                      </p>
                    </div>
                  )}
                </div>
                {closure.location_description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Location Description</p>
                    <p className="text-sm text-gray-900 mt-1">{closure.location_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Closure Details Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Closure Details</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <div className="mt-1">{getTypeBadge(closure.closure_type)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subtype</p>
                    <p className="text-sm text-gray-900">{closure.closure_subtype || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lanes Affected</p>
                    <p className="text-sm text-gray-900">{closure.lanes_affected || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lanes Closed</p>
                    <p className="text-sm text-gray-900">{closure.lanes_closed || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date/Time</p>
                    <p className="text-sm text-gray-900">{formatDateTime(closure.start_date, closure.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date/Time</p>
                    <p className="text-sm text-gray-900">{formatDateTime(closure.end_date, closure.end_time)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{closure.description || 'No description provided'}</p>
                </div>
              </div>
            </div>

            {/* Raw Data Card (Collapsible) */}
            {closure.raw_data && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="w-full px-6 py-4 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">Raw API Data</h2>
                  </div>
                  <svg className={`w-5 h-5 text-gray-600 transition-transform ${showRawData ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showRawData && (
                  <div className="p-6">
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                      {JSON.stringify(closure.raw_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Related Info */}
          <div className="space-y-6">
            {/* Related Active Closures */}
            {related.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">Related Active Closures</h2>
                  </div>
                </div>
                <div className="divide-y">
                  {related.map((rel) => (
                    <Link
                      key={rel.closure_id}
                      href={`/closure/${rel.closure_id}`}
                      className="block p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{rel.route}</p>
                          <p className="text-sm text-gray-500">District {rel.district}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(rel.status)}
                          <p className="text-xs text-gray-500 mt-1">
                            Ends {new Date(rel.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{rel.closure_type}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Closures on Same Route */}
            {historical.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">Recent History</h2>
                  </div>
                </div>
                <div className="divide-y">
                  {historical.map((hist) => (
                    <Link
                      key={hist.closure_id}
                      href={`/closure/${hist.closure_id}`}
                      className="block p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{hist.route}</p>
                          <p className="text-sm text-gray-500">District {hist.district}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                            {hist.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(hist.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{hist.closure_type}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">About This Data</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Closure data is sourced from Caltrans CWWP2 API and updated every 5 minutes during business hours.
                    Status and details are subject to change based on real-time conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
