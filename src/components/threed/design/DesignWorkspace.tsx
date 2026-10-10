'use client';

import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { ScenePanelDivider } from '@/components/map/panels/ScenePanelDivider';

/** Stable siblings retain the existing Scene/Canvas when Design is shown or collapsed. */
export function DesignWorkspace({ active, editor, children, assetsHostRef, split, onSplitChange }: { active: boolean; editor: ReactNode; children: ReactNode; assetsHostRef?: Ref<HTMLDivElement>; split?: number; onSplitChange?: (value: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(45), [availableHeight, setAvailableHeight] = useState(700);
  const [toolbarHeight, setToolbarHeight] = useState(38);
  useEffect(() => {
    const element = container.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.height > 0) setAvailableHeight(entry.contentRect.height); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const toolbar = container.current?.closest('[data-testid="project-scene-workspace"]')?.querySelector('.threed-project-toolbar');
    if (!toolbar) return;
    const measure = () => setToolbarHeight(Math.ceil(toolbar.getBoundingClientRect().height));
    measure(); const observer = new ResizeObserver(measure); observer.observe(toolbar); return () => observer.disconnect();
  }, []);
  const minimum = Math.min(180, availableHeight * .35), bottomMinimum = Math.min(260, availableHeight * .45);
  const mainHeight = Math.max(minimum, Math.min(availableHeight - bottomMinimum - 6, availableHeight * (split ?? height) / 100));
  return <div ref={container} data-testid="design-scene-split" className="absolute inset-x-0 bottom-0 flex min-h-0 min-w-0 flex-col overflow-hidden" style={{ top: active ? toolbarHeight : 0 }}>
    <div data-testid="design-viewing-area" className="flex min-h-0 min-w-0 shrink-0" style={{ height: active ? mainHeight : '100%' }}>
    <div ref={assetsHostRef} hidden={!active} data-testid="design-assets-host" className="threed-scene-sidebar-size relative min-h-0 shrink-0 overflow-hidden" />
    <div data-testid="design-scene-column" className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
    <ScenePanelDivider hidden={!active} containerRef={container} value={mainHeight / availableHeight * 100} onChange={onSplitChange ?? setHeight} axis="vertical" label="Resize bottom Design workspace" />
    <section hidden={!active} inert={!active} data-testid="design-bottom-panel" aria-label="Project ThreeD Design workspace" className="min-h-0 min-w-0 flex-1 overflow-hidden border-t border-white/10 bg-[#0d1420]">{editor}</section>
  </div>;
}
