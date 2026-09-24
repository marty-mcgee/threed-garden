'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { PersistentDetails } from './PersistentDetails';

function sectionText(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? sectionText(child.props.children) : String(child)).join('');
}

export function DetailsCardSection({
  title,
  children,
  defaultOpen = false,
  className = '',
  summaryAside,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryAside?: ReactNode;
}) {
  const label = sectionText(title).replace(/\s*\(\d+\)/g, '').trim();
  return (
    <PersistentDetails
      storageId={label}
      open={defaultOpen}
      className={`mt-2 rounded border border-white/10 bg-white/[0.035] p-2 ${/^Project .+ Instance$/.test(label) ? 'order-[-10]' : ''} ${className}`}
    >
      <summary className="cursor-pointer text-xs font-medium text-cyan-100">
        <span className="inline-flex w-[calc(100%_-_0.75rem)] items-center justify-between gap-2 align-middle">
          <span>{title}</span>
          {summaryAside}
        </span>
      </summary>
      <div className="mt-2 space-y-1.5">{children}</div>
    </PersistentDetails>
  );
}
