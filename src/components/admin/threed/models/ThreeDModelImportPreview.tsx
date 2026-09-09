'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateThreeDModelGroundedY } from '@/lib/services/threed/markers/model-visual-fit-core';
import { createThreeDModelMaterialInventory, resolveThreeDModelMaterialTarget } from '@/lib/services/threed/models/model-material-inventory-core';
import { loadBulkLocalModel } from './model-bulk-local-preview-loader';
import type { BulkLocalModelLease } from './model-gltf-bundle-inspection';
import { BULK_PREVIEW_MESSAGE, validateBulkModelPreviewSnapshot, type BulkModelPreviewSnapshot } from './model-bulk-preview-window';

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p role="alert" className="p-6 text-sm">The 3D preview could not render. Check that WebGL is available, then open Preview Model again.</p>
      : this.props.children;
  }
}

interface LoadedPreview {
  scene: THREE.Group;
  dimensions: [number, number, number];
  center: [number, number, number];
  materialCount: number;
  textureName: string | null;
  missingTexturePaths: string[];
}

function finiteBounds(scene: THREE.Group) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty() || ![...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)) throw new Error('The Model has no finite geometry to preview.');
  return box;
}

export function ThreeDModelImportPreview({ localSnapshot, onClose }: {
  localSnapshot?: BulkModelPreviewSnapshot;
  onClose?: () => void;
} = {}) {
  const inline = localSnapshot !== undefined;
  const [receivedSnapshot, setSnapshot] = useState<BulkModelPreviewSnapshot | null>(null);
  const snapshot = localSnapshot ?? receivedSnapshot;
  const [loaded, setLoaded] = useState<LoadedPreview | null>(null);
  const [error, setError] = useState('');
  const [reset, setReset] = useState(0);

  useEffect(() => {
    if (inline) return;
    const token = new URLSearchParams(window.location.search).get('token');
    const opener = window.opener;
    if (!opener || !token || !/^[\da-f-]{36}$/i.test(token)) {
      setError('Open this preview from Bulk Import Models after selecting a Model.');
      return;
    }
    const origin = window.location.origin;
    let accepted = false;
    const request = () => opener.postMessage({ channel: BULK_PREVIEW_MESSAGE, token, type: 'ready' }, origin);
    const receive = (event: MessageEvent) => {
      if (accepted || event.origin !== origin || event.source !== opener || event.data?.channel !== BULK_PREVIEW_MESSAGE
        || event.data.token !== token || event.data.type !== 'model') return;
      accepted = true;
      window.clearInterval(retry);
      window.clearTimeout(timeout);
      opener.postMessage({ channel: BULK_PREVIEW_MESSAGE, token, type: 'received' }, origin);
      try { validateBulkModelPreviewSnapshot(event.data.snapshot); setSnapshot(event.data.snapshot); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'The selected Model could not be received.'); }
    };
    const retry = window.setInterval(request, 500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(retry);
      if (!accepted) setError('Return to the importer and choose Preview Model again.');
    }, 60_000);
    window.addEventListener('message', receive);
    request();
    return () => { window.removeEventListener('message', receive); window.clearInterval(retry); window.clearTimeout(timeout); };
  }, [inline]);

  useEffect(() => {
    if (!snapshot) return;
    let cancelled = false;
    let lease: BulkLocalModelLease | undefined;
    let override: THREE.Texture | undefined;
    const controller = new AbortController();
    const dispose = () => { cancelled = true; window.clearTimeout(timeout); controller.abort(); lease?.dispose(); override?.dispose(); };
    const timeout = window.setTimeout(() => {
      dispose();
      setError('The preview took too long to load. Check the selected files and try Preview Model again.');
    }, 30_000);
    window.addEventListener('pagehide', dispose);
    setLoaded(null);
    setError('');
    void (async () => {
      try {
        // Missing images can be reviewed here; import readiness remains in the importer.
        const currentLease: BulkLocalModelLease = await loadBulkLocalModel(snapshot.file, snapshot.attachments, true);
        lease = currentLease;
        if (cancelled) { currentLease.dispose(); return; }
        let textureName: string | null = null;
        if (snapshot.existingTextureId !== null) {
          const response = await fetch('/api/threed/model-textures', { cache: 'no-store', signal: controller.signal });
          const payload = await response.json();
          if (!response.ok || payload?.success !== true || !Array.isArray(payload.data)) throw new Error('Existing Textures could not be loaded. Return to the importer and refresh the Texture list.');
          const texture = payload.data.find((entry: { id?: number; isActive?: boolean }) => entry?.id === snapshot.existingTextureId && entry.isActive === true);
          if (!texture || typeof texture.filePath !== 'string' || !/^https:\/\//i.test(texture.filePath)) throw new Error('The selected existing Texture is unavailable. Choose another Texture or None.');
          const inventory = currentLease.materialTargets;
          if (inventory.materialSlotCount === 0 || inventory.omittedSlotCount > 0 || inventory.targetKeys.length !== inventory.materialSlotCount) throw new Error('This Model cannot preview an all-slot Texture assignment. Choose None to review its original materials.');
          override = await new Promise<THREE.Texture>((resolve, reject) => {
            const candidate = new THREE.TextureLoader().load(texture.filePath, (value) => {
              if (cancelled) { value.dispose(); reject(new Error('Preview closed.')); }
              else resolve(value);
            }, undefined, () => reject(new Error('The selected existing Texture image could not be loaded.')));
            override = candidate;
          });
          if (cancelled) return;
          override.colorSpace = THREE.SRGBColorSpace;
          const materials = new Set<THREE.Material>();
          for (const key of inventory.targetKeys) {
            const target = resolveThreeDModelMaterialTarget(currentLease.scene, key);
            if (!target) throw new Error('A Model material slot could not be previewed.');
            const material = Array.isArray(target.mesh.material) ? target.mesh.material[target.slotIndex] : target.mesh.material;
            if (materials.has(material)) continue;
            materials.add(material);
            const mapped = material as THREE.Material & { map?: THREE.Texture; color?: THREE.Color };
            mapped.map = override;
            mapped.color?.set('#ffffff');
            mapped.needsUpdate = true;
          }
          textureName = typeof texture.textureName === 'string' ? texture.textureName : 'Selected Texture';
        }
        if (cancelled) return;
        const scene = currentLease.scene;
        scene.scale.setScalar(snapshot.scale);
        scene.rotation.y = THREE.MathUtils.degToRad(snapshot.rotationY);
        scene.position.set(0, 0, 0);
        const originalBounds = finiteBounds(scene);
        scene.position.set(snapshot.offsetX, calculateThreeDModelGroundedY(originalBounds.min.y, snapshot.offsetY), snapshot.offsetZ);
        const bounds = finiteBounds(scene);
        const dimensions = bounds.getSize(new THREE.Vector3()).toArray() as [number, number, number];
        const center = bounds.getCenter(new THREE.Vector3()).toArray() as [number, number, number];
        const inventory = createThreeDModelMaterialInventory(scene);
        setLoaded({ scene, dimensions, center, materialCount: inventory.materialSlotCount, textureName,
          missingTexturePaths: [...new Set([...snapshot.missingTexturePaths, ...(currentLease.missingTexturePaths ?? [])])] });
      } catch (cause) {
        lease?.dispose();
        override?.dispose();
        if (!cancelled) setError(cause instanceof Error ? cause.message.replace(/\s+/g, ' ').slice(0, 400) : 'The Model could not be previewed. Review its files in the importer.');
      } finally { window.clearTimeout(timeout); }
    })();
    return () => { window.removeEventListener('pagehide', dispose); dispose(); };
  }, [snapshot]);

  const distance = loaded ? Math.max(20, Math.hypot(...loaded.dimensions) * 4) : 20;
  return <section aria-label="ThreeD Model Import Preview" className={`flex min-w-0 flex-col bg-background text-foreground ${inline ? 'overflow-hidden rounded border' : 'min-h-dvh'}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Box className="h-5 w-5" />ThreeD Model Import Preview</h3>
        <p className="break-words text-sm text-muted-foreground">{snapshot?.modelName ?? 'Waiting for the importer…'}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={!loaded} onClick={() => setReset((value) => value + 1)}><RotateCcw className="mr-2 h-4 w-4" />Reset view</Button>
        <Button type="button" variant="outline" onClick={() => inline ? onClose?.() : window.close()}>Close preview</Button>
      </div>
    </header>
    <div className="space-y-2 border-b px-4 py-3 text-sm">
      <p>Local preview only. Change settings in the importer, then choose {inline ? 'Refresh preview' : 'Open preview window'} again to update this {inline ? 'preview' : 'window'}.</p>
      {snapshot && <p className="text-muted-foreground">Scale {snapshot.scale} · Y rotation {snapshot.rotationY}° · Offsets {snapshot.offsetX}, {snapshot.offsetY}, {snapshot.offsetZ} · Grid: 1 scene unit</p>}
      {loaded && <p role="status">Preview ready · Size {loaded.dimensions.map((value) => Number(value.toPrecision(4))).join(' × ')} scene units · {loaded.materialCount} material slots · {loaded.textureName ? `Base Color: ${loaded.textureName}` : 'Original materials and textures'}</p>}
      {loaded && loaded.missingTexturePaths.length > 0 && <div role="status" className="rounded border border-amber-500/60 bg-amber-500/10 p-2">
        <p className="font-medium">Incomplete textures: missing images use a placeholder in this preview.</p>
        <ul className="list-inside list-disc break-words">{loaded.missingTexturePaths.map((path) => <li key={path}>{path}</li>)}</ul>
      </div>}
    </div>
    <PreviewBoundary>
      <div className="relative min-h-[360px] flex-1 bg-[#071426]" style={{ height: inline ? 400 : 'min(70dvh, 900px)' }}>
        {loaded && !error ? <Canvas key={reset} style={{ position: 'absolute', inset: 0 }} camera={{ position: [loaded.center[0] + distance, loaded.center[1] + distance * 0.75, loaded.center[2] + distance * 1.5], fov: 45 }} dpr={[1, 1.5]} frameloop="demand">
          <color attach="background" args={['#071426']} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 8, 5]} intensity={2.4} />
          <directionalLight position={[-4, 3, -5]} intensity={1.1} color="#8ec5ff" />
          <Grid position={[0, -0.01, 0]} args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#24435d" sectionSize={10} sectionThickness={0.8} sectionColor="#3b82a6" fadeDistance={distance} infiniteGrid />
          <Bounds fit clip observe margin={1.25} maxDuration={0.01}><primitive object={loaded.scene} dispose={null} /></Bounds>
          <OrbitControls makeDefault target={loaded.center} enableDamping dampingFactor={0.08} />
        </Canvas> : <div className="flex min-h-[360px] items-center justify-center p-6 text-slate-100">
          {error ? <p role="alert" className="max-w-xl">{error}</p> : <p className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{snapshot ? 'Loading Model and textures…' : 'Receiving selected Model…'}</p>}
        </div>}
      </div>
    </PreviewBoundary>
    <footer className="border-t p-3 text-center text-xs text-muted-foreground">Drag to orbit · Scroll to zoom · Right-drag to pan · Import remains a separate action in the importer.</footer>
  </section>;
}
