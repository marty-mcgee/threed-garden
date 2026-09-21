import { redirect } from 'next/navigation';
import {
  buildDashboardSceneUrl,
  type DashboardRouteSearchParams,
} from '@/libraries/services/map/dashboard-scene-route';

type LegacyMapSearchParams = Promise<DashboardRouteSearchParams>;

export default async function LegacyDashboardMapRedirect({
  searchParams,
}: {
  searchParams: LegacyMapSearchParams;
}) {
  redirect(buildDashboardSceneUrl(await searchParams));
}
