'use client';

import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DesignAction({ label, children, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
    <span className="inline-flex" tabIndex={props.disabled ? 0 : undefined} aria-disabled={props.disabled || undefined} aria-label={props.disabled ? `${label} unavailable` : undefined}>
      <Button type="button" size="icon" variant="outline" {...props} aria-label={label} className={`h-8 w-8 shrink-0 ${props.className ?? ''}`}>{children}</Button>
    </span>
  </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip></TooltipProvider>;
}
