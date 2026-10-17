'use client';
import { useId } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MeasurementUnits } from '@/libraries/services/project/measurement-units';

export function ProjectMeasurementUnits({ value, onChange, disabled = false, helpText = 'Display and input units only. Object sizes, calibration and physics stay unchanged.' }: {
  value: MeasurementUnits; onChange: (value: MeasurementUnits) => void; disabled?: boolean; helpText?: string;
}) {
  const id = useId();
  return <div className="space-y-1 text-xs">
    <div className="flex items-center gap-1">
      <label htmlFor={id}>Project measurement units</label>
      <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="threed-field-help h-6 w-6 shrink-0 text-muted-foreground" aria-label="Project measurement units help"><CircleHelp aria-hidden="true" className="h-3.5 w-3.5" /></Button>
      </TooltipTrigger><TooltipContent className="z-[4000]">{helpText}</TooltipContent></Tooltip></TooltipProvider>
    </div>
    <select id={id} className="h-8 w-full rounded border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      value={value} disabled={disabled} onChange={event => onChange(event.target.value as MeasurementUnits)}>
      <option value="imperial">Imperial (feet / inches)</option>
      <option value="metric">Metric (metres / centimetres)</option>
    </select>
  </div>;
}
