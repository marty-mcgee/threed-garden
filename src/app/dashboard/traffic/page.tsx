import { TrafficMapDashboard } from '@/components/traffic/dashboard/TrafficMapDashboard';

export const metadata = {
  title: 'Traffic Dashboard',
  description: 'Traffic incidents and closures in California',
};

export default function TrafficPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Traffic Dashboard</h1>
        <p className="text-muted-foreground">
          Traffic incidents and closures in California
        </p>
      </div>

      <TrafficMapDashboard />
    </div>
  );
}
