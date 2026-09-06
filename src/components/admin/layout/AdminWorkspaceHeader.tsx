import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminWorkspaceHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

export function AdminWorkspaceHeader({
  icon: Icon,
  title,
  description,
  children,
  className,
}: AdminWorkspaceHeaderProps) {
  return (
    <header className={cn('flex min-h-9 flex-wrap items-center gap-2 border-b pb-2', className)}>
      <div className="flex shrink-0 items-center gap-2">
        <Icon aria-hidden="true" className="h-4 w-4 text-blue-500" />
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>
      <p className="sr-only">{description}</p>
      {children}
    </header>
  );
}

interface AdminWorkspaceLinkProps {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
}

export function AdminWorkspaceLink({ href, icon: Icon, children }: AdminWorkspaceLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 text-xs font-medium text-foreground no-underline transition-colors hover:bg-white/10"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {children}
    </Link>
  );
}
