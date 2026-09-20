'use client';

import { useState, type ReactNode } from 'react';

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
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={`mt-2 rounded border border-white/10 bg-white/[0.035] p-2 ${className}`}
    >
      <summary className="cursor-pointer text-xs font-medium text-cyan-100">
        <span className="inline-flex w-[calc(100%_-_0.75rem)] items-center justify-between gap-2 align-middle">
          <span>{title}</span>
          {summaryAside}
        </span>
      </summary>
      <div className="mt-2 space-y-1.5">{children}</div>
    </details>
  );
}
