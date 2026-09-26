export interface HoverTitleRect { x: number; y: number; width: number; height: number }

/** Prefer above the anchor; choose the nearest clear alternative inside the viewport. */
export function placeHoverTitle(anchor: { x: number; y: number }, viewport: { width: number; height: number }, label: { width: number; height: number }, obstacles: HoverTitleRect[]) {
  const gap = 12;
  const width = Math.min(label.width, Math.max(0, viewport.width - 16));
  const height = label.height;
  const clamp = (n: number, max: number) => Math.max(8, Math.min(n, Math.max(8, max - 8)));
  const candidates = [
    { x: anchor.x - width / 2, y: anchor.y - height - gap },
    { x: anchor.x - width / 2, y: anchor.y + gap },
    { x: anchor.x + gap, y: anchor.y - height / 2 },
    { x: anchor.x - width - gap, y: anchor.y - height / 2 },
    ...obstacles.flatMap(r => [
      { x: r.x + r.width + gap, y: anchor.y - height / 2 },
      { x: r.x - width - gap, y: anchor.y - height / 2 },
      { x: anchor.x - width / 2, y: r.y + r.height + gap },
    ]),
  ].map(p => ({ x: clamp(p.x, viewport.width - width), y: clamp(p.y, viewport.height - height) }));
  const overlap = (p: { x: number; y: number }) => obstacles.reduce((sum, r) => sum
    + Math.max(0, Math.min(p.x + width, r.x + r.width) - Math.max(p.x, r.x))
    * Math.max(0, Math.min(p.y + height, r.y + r.height) - Math.max(p.y, r.y)), 0);
  return candidates.reduce((best, p) => overlap(p) < overlap(best) ? p : best);
}
