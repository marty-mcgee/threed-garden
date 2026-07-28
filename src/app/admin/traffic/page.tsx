// app/admin/traffic/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrafficCHPCADCRUD } from '@/components/admin/traffic/chp-cad/TrafficCHPCADCRUD';
import { TrafficCHPCasesCRUD } from '@/components/admin/traffic/chp-cases/TrafficCHPCasesCRUD';
import { TrafficCaltransCRUD } from '@/components/admin/traffic/caltrans/TrafficCaltransCRUD';
import { TrafficCalfireCRUD } from '@/components/admin/traffic/calfire/TrafficCalfireCRUD';
import { TrafficBayArea511CRUD } from '@/components/admin/traffic/bay-area-511/TrafficBayArea511CRUD';
import { TrafficStats } from '@/components/traffic/dashboard/TrafficStats';

export default function TrafficAdminPage() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Traffic Module</h1>
        <p className="text-muted-foreground">
          Manage traffic data sources and incidents
        </p>
      </div>

      <TrafficStats userId={userId} />

      <Tabs defaultValue="chp-cad" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="chp-cad">CHP Live</TabsTrigger>
          <TabsTrigger value="chp-cases">CHP Historical</TabsTrigger>
          <TabsTrigger value="caltrans">Caltrans</TabsTrigger>
          <TabsTrigger value="calfire">CalFire</TabsTrigger>
          <TabsTrigger value="bay-area-511">Bay Area 511</TabsTrigger>
        </TabsList>

        <TabsContent value="chp-cad">
          <Card>
            <CardHeader>
              <CardTitle>CHP CAD Incidents</CardTitle>
              <CardDescription>
                Live California Highway Patrol dispatch incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficCHPCADCRUD userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chp-cases">
          <Card>
            <CardHeader>
              <CardTitle>CHP Historical Cases</CardTitle>
              <CardDescription>
                Historical collision data from CHP CKAN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficCHPCasesCRUD userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caltrans">
          <Card>
            <CardHeader>
              <CardTitle>Caltrans Lane Closures</CardTitle>
              <CardDescription>
                Real-time lane closures from Caltrans CWWP2
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficCaltransCRUD userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calfire">
          <Card>
            <CardHeader>
              <CardTitle>CalFire Incidents</CardTitle>
              <CardDescription>
                Wildfire incidents from CalFire API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficCalfireCRUD userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bay-area-511">
          <Card>
            <CardHeader>
              <CardTitle>Bay Area 511 Events</CardTitle>
              <CardDescription>
                Real-time traffic events from 511.org
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficBayArea511CRUD userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}