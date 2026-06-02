// src/app/dashboard/511org/511orgContent.tsx (Enhanced)
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Road, Calendar, MapPin, ArrowUpRight } from 'lucide-react';

// ... (keep your existing types and logic)

export default function BayArea511Content() {
  // ... (keep your existing state and functions)

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'major': return 'bg-red-100 text-red-800 border border-red-200';
      case 'minor': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    if (type?.toLowerCase().includes('construction')) return <Road className="w-4 h-4" />;
    if (type?.toLowerCase().includes('incident')) return <AlertTriangle className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bay Area Traffic Events</h2>
          <p className="text-gray-500 text-sm mt-1">Official real-time data from 511.org</p>
        </div>
        <button
          onClick={pollData}
          disabled={isPolling}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
          {isPolling ? 'Fetching...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <p className="text-emerald-600 text-sm font-medium">Total Events</p>
          <p className="text-2xl font-bold text-emerald-900">{events.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-red-600 text-sm font-medium">Active Incidents</p>
          <p className="text-2xl font-bold text-red-900">
            {events.filter(e => e.eventType?.toLowerCase().includes('incident')).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <p className="text-amber-600 text-sm font-medium">Construction</p>
          <p className="text-2xl font-bold text-amber-900">
            {events.filter(e => e.eventType?.toLowerCase().includes('construction')).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-blue-600 text-sm font-medium">Data Source</p>
          <p className="text-lg font-bold text-blue-900">511.org</p>
          <p className="text-xs text-blue-600">MTC</p>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No events found</p>
          <p className="text-sm mt-1">Click refresh to fetch current events from 511.org</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {events.map((event) => (
            <div key={event.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600">
                    {getEventIcon(event.eventType)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.roadwayName || 'Unknown Roadway'}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{event.description?.substring(0, 120)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(event.severity)}`}>
                        {event.eventType || 'Event'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    {event.directionOfTravel && (
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {event.directionOfTravel}
                      </span>
                    )}
                    {event.lanesAffected && (
                      <span className="flex items-center gap-1">
                        <Road className="w-3 h-3" />
                        {event.lanesAffected}
                      </span>
                    )}
                    {event.startTime && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Starts: {new Date(event.startTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        Data source: 511.org | Metropolitan Transportation Commission (MTC)
      </div>
    </div>
  );
}