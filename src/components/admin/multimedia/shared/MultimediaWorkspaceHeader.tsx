import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';

export function MultimediaWorkspaceHeader({ pageHeader, icon: Icon, title, count, children, search }: { pageHeader: boolean; icon: LucideIcon; title: string; count: number; children: ReactNode; search?: ReactNode }) {
  const controls = <>{pageHeader && <ModelFieldHelp label={title}>Manage your Multimedia {title.toLowerCase()}. Parent associations and changes are checked against your signed-in User ownership.</ModelFieldHelp>}<span className="rounded border px-1.5 py-0.5 text-xs">{count}</span>{search}<div className="ml-auto flex flex-wrap items-center gap-2">{children}</div></>;
  return pageHeader ? <AdminWorkspaceHeader icon={Icon} title={title} description={`Manage Multimedia ${title.toLowerCase()}`}>{controls}</AdminWorkspaceHeader> : <div className="flex flex-wrap items-center gap-2"><Icon className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium">{title}</span>{controls}</div>;
}
