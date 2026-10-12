'use client';

import { Building2, Crosshair } from 'lucide-react';
import { PersistentDetails } from '@/components/map/details/PersistentDetails';
import { DesignAction } from '@/components/threed/design/DesignAction';
import type { ArchitectureAsset } from '@/libraries/services/threed/design/asset-inventory';

export function ArchitectureAssetsSection({ assets, selectedId, onSelect, onLocate, locateAvailable }: {
  assets: ArchitectureAsset[]; selectedId?: string | null;
  onSelect: (id: string) => void; onLocate: (id: string) => void; locateAvailable: boolean;
}) {
  if (!assets.length) return null;
  return <PersistentDetails storageId="architecture" open className="rounded-md border border-foreground/10 p-1">
    <summary className="cursor-pointer px-1 py-2 text-xs font-semibold"><Building2 aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />Architecture · {assets.length}</summary>
    <div className="space-y-1">{assets.map(asset => <div key={asset.id} className="flex items-center gap-1">
      <button type="button" aria-pressed={selectedId === asset.id} onClick={() => onSelect(asset.id)}
        className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-left transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/5 ${selectedId === asset.id ? 'border-cyan-500 bg-cyan-500/15 ring-1 ring-cyan-500/40' : 'bg-card'}`}>
        <span className="block break-words text-xs font-medium [overflow-wrap:anywhere]">{asset.label}</span>
        <span className="block break-words text-[10px] leading-relaxed text-muted-foreground">{asset.levelName} · {asset.dimensions}</span>
      </button>
      <DesignAction className="h-7 w-7" label={locateAvailable ? `Locate ${asset.label}` : 'Finish the current transform to locate architecture'} disabled={!locateAvailable} onClick={() => onLocate(asset.id)}><Crosshair aria-hidden="true" className="h-3.5 w-3.5" /></DesignAction>
    </div>)}</div>
  </PersistentDetails>;
}
