// components/traffic/dashboard/TrafficMapDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { EnhancedLeafletMap, TrafficIncident } from '@/components/traffic/map/EnhancedLeafletMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';


export function TrafficMapDashboard() {
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Fetch all traffic data
  const fetchAllTraffic = async () => {
    try {
      const sources = [
        '/api/traffic/chp-cad',
        '/api/traffic/caltrans/closures',
        '/api/traffic/bay-area-511',
        '/api/traffic/calfire',
      ];

      const responses = await Promise.all(sources.map(url => fetch(url)));
      const data = await Promise.all(responses.map(r => r.json()));

      // Transform data to unified format
      const transformed = data.flatMap((sourceData, index) => {
        const sourceNames = ['CHP', 'Caltrans', '511', 'CalFire'];
        const types = ['chp', 'caltrans', '511', 'calfire'];
        
        return sourceData.map((item: any) => ({
          id: item.id || `incident-${Date.now()}-${Math.random()}`,
          type: types[index] as TrafficIncident['type'],
          title: item.title || item.description || 'Incident',
          description: item.description || 'No description available',
          location: item.location || 'Unknown location',
          lat: parseFloat(item.latitude || item.lat || 38.5),
          lng: parseFloat(item.longitude || item.lng || -122.5),
          severity: item.severity || 'medium',
          timestamp: item.timestamp || item.created_at || new Date().toISOString(),
          source: sourceNames[index],
          details: item.details || item,
        }));
      });

      setIncidents(transformed);
      showToast(`Updated: ${transformed.length} incidents loaded`, 'success');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardContent className="p-4">
              <EnhancedLeafletMap
                incidents={incidents}
                onRefresh={handleRefresh}
                autoRefreshInterval={60000}
                height="600px"
                center={[37.3, -119.5]}
                zoom={5}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          {/* Your existing list view */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{incident.title}</h4>
                      <Badge variant="outline">{incident.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <p className="text-xs text-muted-foreground">{incident.location}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}