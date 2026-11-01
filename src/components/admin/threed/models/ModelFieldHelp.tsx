'use client';

import { useRef, useState, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModelFieldHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pointerIntent = useRef<boolean | null>(null);
  return <TooltipProvider delayDuration={200}><Tooltip open={open} onOpenChange={setOpen}><TooltipTrigger asChild>
    <Button type="button" variant="ghost" size="icon" className="threed-field-help h-6 w-6 shrink-0 text-muted-foreground" aria-label={`${label} help`}
      onPointerDown={() => {
        // Radix closes an open tooltip on pointer-down. Retain the user's
        // intended toggle before that close, rather than reopening it on click.
        pointerIntent.current = !open;
      }}
      onPointerCancel={() => { pointerIntent.current = null; }}
      onClick={event => {
        event.preventDefault();
        setOpen(event.detail === 0 ? !open : pointerIntent.current ?? !open);
        pointerIntent.current = null;
      }}>
      <CircleHelp className="h-3.5 w-3.5" />
    </Button>
  </TooltipTrigger><TooltipContent>{children}</TooltipContent></Tooltip></TooltipProvider>;
}
