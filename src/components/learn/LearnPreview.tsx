import { Layers, MoveUpRight, Save } from 'lucide-react';

export function LearnPreview() {
  return <figure className="min-w-0">
    <div className="overflow-hidden rounded-3xl border border-emerald-600/20 bg-emerald-950 text-emerald-50 shadow-xl shadow-black/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4 text-xs">
        <span className="font-semibold uppercase tracking-[.18em]">From a plan to a Project</span>
        <span className="rounded-full border border-emerald-300/20 px-2 py-1">Learn by doing</span>
      </div>
      <svg viewBox="0 0 640 440" role="img" aria-label="Illustration of a room plan becoming a three-dimensional room with a window and garden planting" className="block w-full">
        <defs>
          <pattern id="learn-plan-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#30584b" strokeWidth=".7" /></pattern>
          <linearGradient id="learn-preview-light" x2="1" y2="1"><stop stopColor="#163f33" /><stop offset="1" stopColor="#0c241e" /></linearGradient>
        </defs>
        <rect width="640" height="440" fill="url(#learn-preview-light)" />
        <rect width="640" height="440" fill="url(#learn-plan-grid)" opacity=".7" />
        <g transform="translate(34 234)">
          <rect width="230" height="158" rx="14" fill="#0e2c25" stroke="#4d8b75" />
          <path d="M33 30H197V128H147M101 128H33V30M33 77H100" fill="none" stroke="#a8daca" strokeWidth="5" />
          <path d="M101 128V83A45 45 0 0 1 146 128" fill="none" stroke="#54b693" strokeWidth="1.5" />
          <path d="M179 29H150" stroke="#38bdf8" strokeWidth="5" />
          <circle cx="33" cy="30" r="5" fill="#fbbf24" /><circle cx="197" cy="128" r="5" fill="#fbbf24" />
        </g>
        <path d="M234 204Q275 150 320 177" fill="none" stroke="#72cba9" strokeWidth="2" strokeDasharray="6 7" />
        <path d="M310 164L322 177L304 181" fill="none" stroke="#72cba9" strokeWidth="2" />
        <g strokeLinejoin="round">
          <path d="M298 281L440 200L588 284L444 369Z" fill="#235b48" stroke="#47846d" />
          <path d="M315 261L441 188L564 259L439 332Z" fill="#bda788" />
          <path d="M315 261V126L441 53V188Z" fill="#d4e4dd" />
          <path d="M441 53L564 124V259L441 188Z" fill="#a2bcb3" />
          <path d="M343 130L408 92V161L343 199Z" fill="#174d4a" stroke="#f1f8f3" strokeWidth="7" />
          <path d="M376 112V180M343 165L408 127" stroke="#f1f8f3" strokeWidth="3" />
          <path d="M485 236L531 263L496 284L449 257Z" fill="#8b6344" />
          <path d="M449 257V276L496 303V284M496 284L531 263V282L496 303" fill="#ad8359" />
          {[{ x: 482, y: 242 }, { x: 507, y: 257 }].map(({ x, y }) => <g key={x} transform={`translate(${x} ${y})`}>
            <path d="M0 15V-15" stroke="#67a36d" strokeWidth="3" />
            <ellipse cx="-9" cy="-8" rx="13" ry="7" transform="rotate(30)" fill="#6baf72" />
            <ellipse cx="9" cy="-15" rx="13" ry="8" transform="rotate(-25)" fill="#9aca7d" />
          </g>)}
        </g>
      </svg>
      <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-4 py-5 text-center text-xs sm:text-sm">
        <span className="flex flex-col items-center gap-2"><Layers aria-hidden="true" className="size-4 text-emerald-300" />Draw a plan</span>
        <span className="flex flex-col items-center gap-2"><MoveUpRight aria-hidden="true" className="size-4 text-emerald-300" />Explore in 3D</span>
        <span className="flex flex-col items-center gap-2"><Save aria-hidden="true" className="size-4 text-emerald-300" />Save and return</span>
      </div>
    </div>
    <figcaption className="mt-3 text-sm text-muted-foreground">An illustrative starting point. Follow the guides below in your own Project.</figcaption>
  </figure>;
}
