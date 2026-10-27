'use client';

import { usePathname } from 'next/navigation';
import { useModuleAppearance } from '@/components/settings/ModuleAppearanceProvider';
import { moduleIcons } from '@/components/settings/module-icons';
import { moduleColors as iconColors, moduleForPath, type ModuleKey } from '@/libraries/config/module-appearance';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/libraries/utils';

interface AdminWorkspaceHeaderProps {
  moduleKey?: ModuleKey;
  icon: LucideIcon;
  iconColor?: keyof typeof iconColors;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

export function AdminWorkspaceHeader({
  icon: DefaultIcon,
  moduleKey,
  iconColor = 'green',
  title,
  description,
  children,
  className,
}: AdminWorkspaceHeaderProps) {
  const pathname = usePathname();
  const appearance = useModuleAppearance();
  const key = moduleKey ?? moduleForPath(pathname ?? '');
  const style = key ? appearance?.snapshot.styles[key] : undefined;
  const Icon = style ? moduleIcons[style.icon] : DefaultIcon;
  return (
    <header className={cn('flex min-h-9 flex-wrap items-center gap-2 border-b pb-2', className)}>
      <div className="flex shrink-0 items-center gap-2">
        <Icon aria-hidden="true" className={cn('h-4 w-4', iconColors[style?.color ?? iconColor])} />
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
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 text-xs font-medium text-foreground no-underline transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [@media(pointer:coarse)]:min-h-11"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {children}
    </Link>
  );
}
