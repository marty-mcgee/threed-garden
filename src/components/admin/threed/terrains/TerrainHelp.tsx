'use client';

import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** Keep help on the existing field name or section button, without a separate icon. */
export function TerrainHelp({ content, children }: { content: ReactNode; children: ReactElement }) {
  if (!content) return children;
  return <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}
