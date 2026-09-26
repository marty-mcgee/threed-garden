import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Badge } from '@/components/ui/badge';

export function MusicWorkspaceHeader({ pageHeader, icon: Icon, title, count, children, search }: { pageHeader: boolean; icon: LucideIcon; title: string; count: number; children: ReactNode; search?: ReactNode }) {
  const controls = <><Badge variant="secondary" className="text-xs">{count}</Badge>{search}<div className="ml-auto flex flex-wrap items-center gap-2">{children}</div></>;
  return pageHeader ? <AdminWorkspaceHeader icon={Icon} title={title} description={`Manage Multimedia ${title.toLowerCase()}`}>{controls}</AdminWorkspaceHeader> : <div className="flex flex-wrap items-center gap-2"><Icon className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium">{title}</span>{controls}</div>;
}
