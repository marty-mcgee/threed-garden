'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Grid, OrbitControls, useBounds } from '@react-three/drei';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ModelMarker3D,
  type ModelCollisionBounds,
} from '@/components/threed/markers/ModelMarker3D';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';

function FittedLibraryModel({
  model,
  onSettled,
  onError,
}: {
  model: ThreeDModelLibraryItem;
  onSettled: () => void;
  onError: (message: string | null) => void;
}) {
  const bounds = useBounds();
  const handleBounds = useCallback((value: ModelCollisionBounds | null) => {
    if (!value) return;
    requestAnimationFrame(() => bounds.refresh().clip().fit());
  }, [bounds]);

  return (
    <ModelMarker3D
      model={model}
      position={[0, 0, 0]}
      onCollisionBoundsChange={handleBounds}
      onRuntimeSettled={onSettled}
      onRuntimeError={onError}
    />
  );
}

export function ThreeDModelLibraryPreview({ model }: { model: ThreeDModelLibraryItem }) {
  const [settledModelId, setSettledModelId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const loading = settledModelId !== model.id;

  useEffect(() => {
    setSettledModelId(null);
    setError(null);
  }, [model.id]);

  return (
    <div className="relative h-44 overflow-hidden rounded border bg-slate-950" aria-label={`Configured preview of ${model.modelName}`}>
      <Canvas key={`${model.id}:${resetKey}`} camera={{ position: [4, 3, 6], fov: 45 }} dpr={[1, 1.35]}>
        <color attach="background" args={['#071426']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 8, 5]} intensity={2.4} />
        <directionalLight position={[-4, 3, -5]} intensity={1.1} color="#8ec5ff" />
        <Grid
          position={[0, -0.01, 0]}
          args={[12, 12]}
          cellSize={0.5}
          cellColor="#24435d"
          sectionSize={2}
          sectionColor="#3b82a6"
          fadeDistance={12}
          infiniteGrid
        />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.2}>
            <FittedLibraryModel
              model={model}
              onSettled={() => setSettledModelId(model.id)}
              onError={setError}
            />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-1.5 top-1.5 h-7 w-7 bg-background/75"
        title="Reset preview camera"
        onClick={() => setResetKey((value) => value + 1)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/60 text-[10px] text-slate-200">
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Loading configured Model…
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded bg-amber-950/90 px-2 py-1.5 text-[10px] text-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}
