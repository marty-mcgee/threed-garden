export type DashboardRouteSearchParams = Record<string, string | string[] | undefined>;

export function buildDashboardSceneUrl(searchParams: DashboardRouteSearchParams = {}): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach(item => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const suffix = query.toString();
  return `/dashboard/scene${suffix ? `?${suffix}` : ''}`;
}
