import { redirect } from 'next/navigation';

// Preserve bookmarks without retaining a parent Model requirement.
export default function LegacyModelAnimationsPage() {
  redirect('/admin/threed/animations');
}
