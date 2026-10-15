'use client';
import type { MeasurementUnits } from '@/libraries/services/project/measurement-units';

export function ProjectMeasurementUnits({ value, onChange, disabled = false }: {
  value: MeasurementUnits; onChange: (value: MeasurementUnits) => void; disabled?: boolean;
}) {
  return <label className="block space-y-1 text-xs">
    <span>Project measurement units</span>
    <select className="h-8 w-full rounded border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      value={value} disabled={disabled} onChange={event => onChange(event.target.value as MeasurementUnits)}>
      <option value="imperial">Imperial (feet / inches)</option>
      <option value="metric">Metric (metres / centimetres)</option>
    </select>
    <span className="block text-[11px] text-muted-foreground">Display and input units only. Object sizes, calibration and physics stay unchanged.</span>
  </label>;
}
