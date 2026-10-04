'use client';

import { useState, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModelFieldHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <TooltipProvider delayDuration={200}><Tooltip open={open} onOpenChange={setOpen}><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" aria-label={`${label} help`} onClick={event => { event.preventDefault(); setOpen(value => !value); }}><CircleHelp className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>{children}</TooltipContent></Tooltip></TooltipProvider>;
}
