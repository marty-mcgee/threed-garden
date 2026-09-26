'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { RotateCcw, ArrowUpRight } from 'lucide-react';

const GardenCanvas = dynamic(() => import('./GardenHeroCanvas'), { ssr: false, loading: () => null });

class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function GardenPoster() {
  return (
    <svg viewBox="0 0 640 460" role="img" aria-label="Illustration of a raised garden bed with rows of plants on a planning grid" className="absolute inset-0 h-full w-full">
      <defs>
        <pattern id="garden-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#365b48" strokeWidth="1" /></pattern>
      </defs>
      <g transform="translate(320 235) scale(1 .55) rotate(-30)">
        <rect x="-225" y="-225" width="450" height="450" rx="24" fill="#234334" />
        <rect x="-225" y="-225" width="450" height="450" fill="url(#garden-grid)" />
        <rect x="-110" y="-165" width="220" height="330" rx="8" fill="#a7794e" stroke="#d5ad73" strokeWidth="12" />
        <rect x="-90" y="-145" width="180" height="290" rx="6" fill="#403123" />
        {[-55, 55].flatMap(x => [-100, 0, 100].map(y => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><ellipse rx="31" ry="20" fill="#388052" /><ellipse rx="16" ry="28" fill="#70a857" /><circle r="9" fill="#b4cf76" /></g>))}
      </g>
    </svg>
  );
}

export default function GardenHero() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [reset, setReset] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    motion(); visibility();
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setLoaded(true);
    });
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return (
    <section aria-label="Interactive garden preview" className="overflow-hidden rounded-3xl border border-emerald-200/20 bg-[#102b21] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-xs text-emerald-100">
        <span className="font-semibold uppercase tracking-[.18em]">The garden studio</span>
        <span className="rounded-full border border-emerald-300/20 px-2 py-1">Concept garden · 3D</span>
      </div>
      <div ref={container} className="relative h-[340px] sm:h-[440px]" aria-label="Garden view. Drag to orbit; pinch or scroll to zoom.">
        {!ready || failed ? <GardenPoster /> : null}
        {loaded && !failed && <CanvasBoundary onFailure={() => setFailed(true)}>
          <GardenCanvas active={visible && pageVisible} reducedMotion={reducedMotion} reset={reset} onReady={() => setReady(true)} onFailure={() => setFailed(true)} />
        </CanvasBoundary>}
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-green-950/80 px-3 py-2 text-xs text-emerald-100">
          Raised bed · 1.2 × 2.4 m<br /><span className="text-emerald-200/60">Illustrative layout · grid 0.5 m</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
        <p className="text-xs text-emerald-100/70" role="status">{failed ? 'Static preview · interactive 3D unavailable' : ready ? 'Drag to orbit · scroll or pinch to zoom' : 'Loading interactive garden…'}</p>
        <button type="button" disabled={!ready || failed} onClick={() => setReset(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-40"><RotateCcw size={14} />Reset View</button>
        <Link href="/dashboard/scene" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">Open ThreeD Scene <ArrowUpRight size={16} /></Link>
      </div>
    </section>
  );
}
