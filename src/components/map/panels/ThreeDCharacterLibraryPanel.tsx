'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ThreeDCharacterLibraryItem } from '@/lib/types/threed';

interface ThreeDModuleOption {
  id: number;
  name: string;
}

interface ThreeDCharacterLibraryPanelProps {
  isOpen: boolean;
  projectModules: ThreeDModuleOption[];
  selectedModuleId: number | null;
  onSelectedModuleChange: (moduleId: number) => void;
  characters: ThreeDCharacterLibraryItem[];
  placedCharacterIds: ReadonlySet<number>;
  loading: boolean;
  placing: boolean;
  placementCharacter: ThreeDCharacterLibraryItem | null;
  onSelectCharacter: (character: ThreeDCharacterLibraryItem) => void;
  onCancelPlacement: () => void;
  onClose: () => void;
}

export function ThreeDCharacterLibraryPanel({
  isOpen,
  projectModules,
  selectedModuleId,
  onSelectedModuleChange,
  characters,
  placedCharacterIds,
  loading,
  placing,
  placementCharacter,
  onSelectCharacter,
  onCancelPlacement,
  onClose,
}: ThreeDCharacterLibraryPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-1 top-9 z-40 w-[min(24rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">ThreeD Character Library</h2>
          <p className="text-[11px] text-muted-foreground">
            Select a Character, then click its unique spawn location in the ThreeD Scene.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={placing} onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {projectModules.length > 1 && (
        <label className="mb-2 block text-xs">
          <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={selectedModuleId ?? ''}
            disabled={placing}
            onChange={(event) => onSelectedModuleChange(Number(event.target.value))}
          >
            {projectModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
      )}

      {placementCharacter && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded border border-violet-500/40 bg-violet-500/10 p-2 text-xs">
          <span>
            Placing <strong>{placementCharacter.name}</strong>
            {' '}with {placementCharacter.libraryAccess.runtime} runtime
            {placing ? '…' : ' — click the ground'}
          </span>
          <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" disabled={placing} onClick={onCancelPlacement}>
            Cancel
          </Button>
        </div>
      )}

      <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading Characters…
          </div>
        ) : characters.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No eligible Character Library items are available. Character models must be active and classified for Character use.
          </p>
        ) : characters.map((character) => {
          const isPlaced = placedCharacterIds.has(Number(character.id));
          return (
            <div key={character.id} className="flex items-center gap-2 rounded border p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-500/10 text-violet-600">
                {character.libraryAccess.runtime === 'ecctrl' ? '🎮' : '🧚'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{character.name}</div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  {character.libraryAccess.runtime} · {character.type ?? 'character'}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                disabled={!selectedModuleId || placing || isPlaced}
                onClick={() => onSelectCharacter(character)}
              >
                {isPlaced ? 'Placed' : 'Place'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
