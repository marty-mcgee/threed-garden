// components/traffic/dashboard/TrafficMapDashboard.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { EnhancedLeafletMap, TrafficIncident } from '@/components/traffic/map/EnhancedLeafletMap';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const trafficSources = [
  {
    key: 'chp-live',
    url: '/api/traffic/chp-cad?limit=500',
    name: 'CHP',
    type: 'chp',
    label: 'CHP Incidents',
  },
  {
    key: 'chp-historical',
    url: '/api/traffic/chp-cases?limit=500',
    name: 'CHP Historical',
    type: 'chp',
    label: 'CHP Historical',
  },
  {
    key: 'caltrans',
    url: '/api/traffic/caltrans/closures/raw?limit=500&showAll=true',
    name: 'Caltrans',
    type: 'caltrans',
    label: 'Caltrans',
  },
  {
    key: 'calfire',
    url: '/api/traffic/calfire?limit=500&showAll=true',
    name: 'CalFire',
    type: 'calfire',
    label: 'CalFire',
  },
  {
    key: 'bay-area-511',
    url: '/api/traffic/bay-area-511?limit=500&showAll=true',
    name: '511',
    type: '511',
    label: 'Bay Area 511.org',
  },
] as const;


export function TrafficMapDashboard() {
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [enabledSources, setEnabledSources] = useState<Set<string>>(
    () => new Set(trafficSources.map((source) => source.name)),
  );
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const incidentRows = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Fetch all traffic data
  const fetchAllTraffic = async () => {
    try {
      const results = await Promise.allSettled(
        trafficSources.map(async (source) => {
          const response = await fetch(source.url);
          const payload = await response.json();

          if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
            throw new Error(payload.error || `${source.name} returned an invalid response`);
          }

          return { source, records: payload.data as Record<string, unknown>[] };
        }),
      );

      const transformed = results.flatMap((result) => {
        if (result.status === 'rejected') return [];

        const { source, records } = result.value;
        return records.flatMap((item, index) => {
          const latitude = Number(item.latitude ?? item.lat);
          const longitude = Number(item.longitude ?? item.lng);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

          return [{
            id: `${source.key}-${String(item.id ?? `${latitude}-${longitude}-${index}`)}`,
            type: source.type as TrafficIncident['type'],
            title: String(item.title ?? item.description ?? item.name ?? 'Incident'),
            description: String(item.description ?? 'No description available'),
            location: String(item.location ?? item.roadwayName ?? item.route ?? 'Unknown location'),
            lat: latitude,
            lng: longitude,
            severity: normalizeSeverity(item.severity),
            timestamp: String(item.timestamp ?? item.reportedAt ?? item.startTime ?? item.start_date ?? ''),
            source: source.name,
          }];
        });
      });

      setIncidents(transformed);
      const failedSources = results.flatMap((result, index) =>
        result.status === 'rejected' ? [trafficSources[index].name] : [],
      );

      if (failedSources.length > 0) {
        showToast(`Loaded ${transformed.length} incidents. Unavailable: ${failedSources.join(', ')}`, 'info');
      }
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
      showToast('Failed to load traffic data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTraffic();
  }, []);

  const handleRefresh = async () => {
    await fetchAllTraffic();
  };

  const toggleSource = (sourceName: string) => {
    setEnabledSources((current) => {
      const next = new Set(current);
      if (next.has(sourceName)) next.delete(sourceName);
      else next.add(sourceName);
      return next;
    });
  };

  const visibleIncidents = useMemo(
    () => incidents.filter((incident) => enabledSources.has(incident.source)),
    [enabledSources, incidents],
  );

  useEffect(() => {
    if (
      selectedIncidentId &&
      !visibleIncidents.some((incident) => incident.id === selectedIncidentId)
    ) {
      setSelectedIncidentId(null);
    }
  }, [selectedIncidentId, visibleIncidents]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    incidentRows.current.get(selectedIncidentId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [selectedIncidentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-[3px]">
        {trafficSources.map((source) => {
          const enabled = enabledSources.has(source.name);
          const count = incidents.filter((incident) => incident.source === source.name).length;

          return (
            <Button
              key={source.key}
              type="button"
              variant={enabled ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSource(source.name)}
              aria-pressed={enabled}
              title={`${enabled ? 'Hide' : 'Show'} ${source.label} layer`}
            >
              {enabled ? <Eye /> : <EyeOff />}
              {source.label} ({count})
            </Button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <EnhancedLeafletMap
            incidents={visibleIncidents}
            selectedIncidentId={selectedIncidentId}
            onIncidentSelect={setSelectedIncidentId}
            onRefresh={handleRefresh}
            height="600px"
            center={[37.3, -119.5]}
            zoom={5}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Visible Traffic Incidents</h2>
            <Badge variant="secondary">{visibleIncidents.length}</Badge>
          </div>
          <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {visibleIncidents.map((incident) => {
              const selected = incident.id === selectedIncidentId;

              return (
                <button
                  key={incident.id}
                  ref={(element) => {
                    if (element) incidentRows.current.set(incident.id, element);
                    else incidentRows.current.delete(incident.id);
                  }}
                  type="button"
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                  aria-pressed={selected}
                >
                  <div className="flex justify-between gap-3">
                    <h3 className="font-medium">{incident.title}</h3>
                    <Badge variant={selected ? 'default' : 'outline'}>{incident.source}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <p className="text-xs text-muted-foreground">{incident.location}</p>
                </button>
              );
            })}

            {visibleIncidents.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No incidents are visible. Enable a traffic layer above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeSeverity(value: unknown): TrafficIncident['severity'] {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') {
    return value;
  }

  if (typeof value === 'number') {
    if (value >= 5) return 'critical';
    if (value >= 4) return 'high';
    if (value <= 2) return 'low';
  }

  return 'medium';
}
