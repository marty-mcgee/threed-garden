'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { PersistentDetails } from './PersistentDetails';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';

function sectionText(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? sectionText(child.props.children) : String(child)).join('');
}

export function DetailsCardSection({
  title,
  children,
  defaultOpen = false,
  className = '',
  summaryAside,
  storageId,
  help,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryAside?: ReactNode;
  /** Keep saved section preferences stable when the visible title changes. */
  storageId?: string;
  help?: ReactNode;
}) {
  const titleText = sectionText(title).replace(/\s*\(\d+\)/g, '').trim();
  const label = storageId ?? titleText;
  return (
    <PersistentDetails
      storageId={label}
      data-character-settings-section={['Module / Position', 'Character Physics', 'Model + Mesh', 'Character Defaults'].includes(label) ? '' : undefined}
      open={defaultOpen}
      className={`mt-2 rounded border border-foreground/10 bg-foreground/[0.035] p-2 ${/^Project .+ Instance$/.test(label) ? 'order-[-10]' : ''} ${className}`}
    >
      <summary className="cursor-pointer text-xs font-medium text-cyan-800 dark:text-cyan-100">
        <span className="inline-flex w-[calc(100%_-_1rem)] items-center justify-between gap-2 align-middle">
          <span className="min-w-0">{title}</span>
          {(help || summaryAside) && <span className="inline-flex shrink-0 items-center gap-1">
            {summaryAside}
            {help && <ModelFieldHelp label={titleText}>{help}</ModelFieldHelp>}
          </span>}
        </span>
      </summary>
      <div className="mt-2 space-y-1.5">{children}</div>
    </PersistentDetails>
  );
}
