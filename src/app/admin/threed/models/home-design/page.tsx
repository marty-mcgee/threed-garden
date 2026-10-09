import { redirect } from 'next/navigation';
/** Preserve bookmarked alpha editor URLs. */
export default async function LegacyDesignPage({ searchParams }: { searchParams: Promise<{ designId?: string }> }) {
  const query = await searchParams;
  redirect(`/admin/threed/designs${query.designId && /^[1-9]\d*$/.test(query.designId) ? `?designId=${query.designId}` : ''}`);
}
