'use client';

export function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span className="text-[10px] text-foreground/40 shrink-0 w-[52px] text-right">{label}</span>
      <span className="min-w-0 flex-1 break-words text-[11px] leading-relaxed text-foreground/80 [overflow-wrap:anywhere]">{value}</span>
    </div>
  );
}

