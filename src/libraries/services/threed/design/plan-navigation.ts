import { INCH, screenToPlan, type PlanPoint, type PlanView } from './document';

export const RULER_SIZE = 28;
export const gridFeet = (scale: number) => 2 ** Math.max(0, Math.ceil(Math.log2(12 / (12 * INCH * scale))));
export function zoomPlan(view: PlanView, pointer: { x: number; y: number }, delta: number): PlanView {
  const world = screenToPlan(pointer, view), scale = Math.min(300, Math.max(.05, view.scale * Math.exp(-delta * .001)));
  return { x: pointer.x - world.x * scale, y: pointer.y - world.z * scale, scale };
}
export function framePlan(points: PlanPoint[], size: { width: number; height: number }): PlanView | null {
  if (!points.length || size.width <= RULER_SIZE + 40 || size.height <= RULER_SIZE + 40) return null;
  const minX = Math.min(...points.map(p => p.x)) - .3, maxX = Math.max(...points.map(p => p.x)) + .3;
  const minZ = Math.min(...points.map(p => p.z)) - .3, maxZ = Math.max(...points.map(p => p.z)) + .3;
  const scale = Math.max(.05, Math.min(300, (size.width - RULER_SIZE - 40) / (maxX - minX), (size.height - RULER_SIZE - 40) / (maxZ - minZ)));
  return { x: (size.width + RULER_SIZE) / 2 - (minX + maxX) / 2 * scale, y: (size.height + RULER_SIZE) / 2 - (minZ + maxZ) / 2 * scale, scale };
}
/** CSS pixels match the SVG coordinates; SVG itself handles device pixel ratio. */
export function rulerTicks(origin: number, scale: number, extent: number, units: 'imperial' | 'metric' = 'imperial') {
  const step = gridFeet(scale) * 12 * INCH, major = 2 ** Math.max(0, Math.ceil(Math.log2(64 / (step * scale))));
  const labelSpacing = step * major;
  const metricDecimals = labelSpacing >= 2 ? 0 : labelSpacing >= .5 ? 1 : 2;
  const first = Math.ceil((RULER_SIZE - origin) / (scale * step)), last = Math.floor((extent - origin) / (scale * step));
  return Array.from({ length: Math.max(0, Math.min(2000, last - first + 1)) }, (_, n) => {
    const index = first + n, world = index * step;
    return { index, world, pixel: origin + world * scale, major: index % major === 0, label: units === 'metric' ? `${Number(world.toFixed(metricDecimals))} m` : `${Number((world / (12 * INCH)).toFixed(3))} ft` };
  });
}

/** Compact object dimensions; preserve fractional inches without a 12-inch carry error. */
export function formatPlanLength(metres: number, units: 'imperial' | 'metric'): string {
  if (units === 'metric') return `${Number(metres.toFixed(3))} m`;
  const inches = Math.round(Math.abs(metres / INCH) * 100) / 100;
  const feet = Math.floor(inches / 12), remainder = Number((inches - feet * 12).toFixed(2));
  return `${metres < 0 ? '-' : ''}${feet}'${remainder}"`;
}
