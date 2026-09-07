'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Grid, OrbitControls, useBounds } from '@react-three/drei';
import { Box, Check, ImageOff, Loader2, Palette, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ModelMarker3D,
  type ModelCollisionBounds,
  type ModelData,
} from '@/components/threed/markers/ModelMarker3D';
import type {
  ThreeDModelMaterialInventory,
  ThreeDModelMaterialPreviewOverride,
  ThreeDModelMaterialSlot,
} from '@/lib/services/threed/models/model-material-inventory-core';
import { readThreeDModelMaterialOverrides } from '@/lib/services/threed/models/model-material-override-core';

interface ThreeDModelAssetPreviewProps {
  model: ModelData | null;
  attachedDependencyCount: number;
  dependencyCount: number;
  title?: string;
  description?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  canvasClassName?: string;
  showMaterialInspector?: boolean;
  splitMaterialInspector?: boolean;
  textureLibrary?: ThreeDModelTextureLibraryItem[];
  onSaveMaterialAssignment?: (assignment: { targetKeys: string[]; textureFileId?: number; textureId?: number }) => Promise<void>;
}

export interface ThreeDModelTextureLibraryItem {
  id: number;
  textureName: string;
  fileName: string;
  filePath: string;
  assignmentCount: number;
}

function PreviewModel({
  model,
  onSettled,
  onMaterialInventoryChange,
  materialPreviewOverride,
  materialPreviewSelectionId,
}: {
  model: ModelData;
  onSettled: () => void;
  onMaterialInventoryChange?: (inventory: ThreeDModelMaterialInventory | null) => void;
  materialPreviewOverride?: ThreeDModelMaterialPreviewOverride | null;
  materialPreviewSelectionId?: string | null;
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
      onMaterialInventoryChange={onMaterialInventoryChange}
      materialPreviewOverride={materialPreviewOverride}
      materialPreviewSelectionId={materialPreviewSelectionId}
    />
  );
}

function MaterialSlotRow({
  slot,
  selected,
  onSelect,
  savedTextureRelativePath,
}: {
  slot: ThreeDModelMaterialSlot;
  selected: boolean;
  onSelect: () => void;
  savedTextureRelativePath?: string;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded border px-2.5 py-2 text-left transition-colors ${
        selected ? 'border-cyan-400/70 bg-cyan-500/10' : 'border-border/60 bg-background/20 hover:bg-muted/40'
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="flex min-w-0 items-center gap-2">
        {slot.textures.some((texture) => texture.ready)
          ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          : <ImageOff className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{slot.materialName}</span>
        <span className="shrink-0 text-[9px] text-muted-foreground">slot {slot.slotIndex + 1}</span>
      </div>
      <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground" title={slot.meshPath}>{slot.meshPath}</p>
      <p className="mt-1 text-[9px] text-muted-foreground">
        {slot.materialType}{slot.color ? ` · ${slot.color}` : ''} · {slot.textures.length > 0
          ? slot.textures.map((texture) => `${texture.label}: ${texture.ready ? `${texture.width}×${texture.height}` : 'image unavailable'}`).join(', ')
          : 'no texture maps connected'}
      </p>
      {slot.textures.map((texture) => texture.source && (
        <p key={texture.property} className="mt-1 truncate font-mono text-[9px] text-muted-foreground" title={texture.source}>
          {texture.label}: {texture.source}
        </p>
      ))}
      {savedTextureRelativePath && (
        <p className="mt-1 truncate text-[9px] font-medium text-emerald-400" title={savedTextureRelativePath}>
          Saved Base Color: {savedTextureRelativePath}
        </p>
      )}
    </button>
  );
}

export function ThreeDModelAssetPreview({
  model,
  attachedDependencyCount,
  dependencyCount,
  title = 'Model preview',
  description = 'Uses the primary Model file and all currently available attachments.',
  headerMeta,
  headerActions,
  canvasClassName = 'h-[320px]',
  showMaterialInspector = false,
  splitMaterialInspector = false,
  textureLibrary = [],
  onSaveMaterialAssignment,
}: ThreeDModelAssetPreviewProps) {
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [materialInventory, setMaterialInventory] = useState<ThreeDModelMaterialInventory | null>(null);
  const [selectedMaterialSlotId, setSelectedMaterialSlotId] = useState<string | null>(null);
  const [materialPreviewOverride, setMaterialPreviewOverride] = useState<ThreeDModelMaterialPreviewOverride | null>(null);
  const [savingMaterialAssignment, setSavingMaterialAssignment] = useState(false);
  const [materialAssignmentError, setMaterialAssignmentError] = useState<string | null>(null);
  const [quickTextureId, setQuickTextureId] = useState('');
  const materialTextureInputRef = useRef<HTMLInputElement>(null);
  const modelKey = model
    ? `${model.id}:${model.filePath}:${model.files?.map((file) => `${file.relativePath}:${file.filePath}`).join('|') ?? ''}`
    : null;
  const loading = Boolean(modelKey && settledKey !== modelKey);
  const selectedMaterialSlot = materialInventory?.slots.find((slot) => slot.id === selectedMaterialSlotId) ?? null;
  const availableTextureAttachments = model?.files?.filter((file) => (
    file.fileType === 'texture'
    && /\.(?:png|jpe?g|webp|bmp)$/i.test(file.fileName)
    && /^https:\/\//i.test(file.filePath)
  )) ?? [];
  const savedMaterialOverrides = readThreeDModelMaterialOverrides(model?.metadata);
  const selectedUploadedTexture = materialPreviewOverride && !materialPreviewOverride.textureUrl.startsWith('blob:')
    ? availableTextureAttachments.find((file) => file.filePath === materialPreviewOverride.textureUrl) ?? null
    : null;
  const selectedLibraryTexture = materialPreviewOverride && !materialPreviewOverride.textureUrl.startsWith('blob:')
    ? textureLibrary.find((texture) => texture.filePath === materialPreviewOverride.textureUrl) ?? null
    : null;

  useEffect(() => {
    setSelectedMaterialSlotId(null);
    setMaterialPreviewOverride(null);
    setMaterialAssignmentError(null);
    setQuickTextureId('');
  }, [modelKey]);

  useEffect(() => () => {
    if (materialPreviewOverride?.textureUrl.startsWith('blob:')) {
      URL.revokeObjectURL(materialPreviewOverride.textureUrl);
    }
  }, [materialPreviewOverride]);

  const handleTemporaryTexture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedMaterialSlotId) return;
    setMaterialPreviewOverride({
      targetKey: selectedMaterialSlotId,
      textureUrl: URL.createObjectURL(file),
      fileName: file.name,
    });
  };

  const selectMaterialSlot = (slot: ThreeDModelMaterialSlot) => {
    setSelectedMaterialSlotId(slot.id);
    setMaterialAssignmentError(null);
    const saved = savedMaterialOverrides.assignments.find((assignment) => (
      assignment.targetKey === slot.id && assignment.channel === 'baseColor'
    ));
    const attachment = saved
      ? availableTextureAttachments.find((file) => (
        (file.relativePath || file.fileName).toLowerCase() === saved.textureRelativePath.toLowerCase()
      ))
      : null;
    const libraryTexture = saved
      ? textureLibrary.find((texture) => texture.filePath === saved.textureRelativePath)
      : null;
    const selectedTexture = libraryTexture ?? attachment;
    setMaterialPreviewOverride(selectedTexture ? {
      targetKey: slot.id,
      textureUrl: selectedTexture.filePath,
      fileName: selectedTexture.fileName,
    } : null);
  };

  return (
    <div className={splitMaterialInspector ? 'contents' : undefined}>
    <section className={`order-1 overflow-hidden rounded-lg border bg-muted/20 ${splitMaterialInspector ? 'lg:sticky lg:top-2 lg:col-start-1 lg:row-span-2 lg:row-start-1' : ''}`} aria-labelledby="model-preview-title">
      <div className="flex min-h-10 items-center gap-2 border-b px-3 py-2">
        <Box className="h-4 w-4 text-blue-400" />
        <div className="min-w-0 flex-1">
          <h2 id="model-preview-title" className="truncate text-xs font-semibold">{title}</h2>
          <p className="text-[10px] text-muted-foreground">
            {description}
          </p>
        </div>
        {headerMeta}
        {dependencyCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {attachedDependencyCount}/{dependencyCount} dependencies
          </span>
        )}
        {headerActions}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Reset preview camera"
          disabled={!model}
          onClick={() => setResetKey((value) => value + 1)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className={`relative bg-gradient-to-b from-sky-950/40 to-slate-950 ${canvasClassName}`}>
        {!model ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Select a Model to preview its available assets.
          </div>
        ) : (
          <Canvas key={`${modelKey}:${resetKey}`} camera={{ position: [4, 3, 6], fov: 45 }} dpr={[1, 1.5]}>
            <color attach="background" args={['#071426']} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[5, 8, 5]} intensity={2.4} />
            <directionalLight position={[-4, 3, -5]} intensity={1.1} color="#8ec5ff" />
            <Grid
              position={[0, -0.01, 0]}
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#24435d"
              sectionSize={2}
              sectionThickness={0.8}
              sectionColor="#3b82a6"
              fadeDistance={18}
              infiniteGrid
            />
            <Suspense fallback={null}>
              <Bounds fit clip margin={1.25}>
                <PreviewModel
                  model={model}
                  onSettled={() => setSettledKey(modelKey)}
                  onMaterialInventoryChange={showMaterialInspector ? setMaterialInventory : undefined}
                  materialPreviewOverride={showMaterialInspector ? materialPreviewOverride : null}
                  materialPreviewSelectionId={showMaterialInspector ? selectedMaterialSlotId : null}
                />
              </Bounds>
            </Suspense>
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
          </Canvas>
        )}
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/55 text-xs text-slate-200">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading available Model assets…
          </div>
        )}
      </div>
    </section>
      {showMaterialInspector && model && (
        <section className={`${splitMaterialInspector ? 'order-3 rounded-lg border bg-muted/20 lg:col-start-2 lg:row-start-2' : 'border-t bg-background/35'} p-3`} aria-labelledby="model-texture-assignment-title">
          <div className="flex flex-wrap items-center gap-2">
            <Palette className="h-4 w-4 text-cyan-400" />
            <h3 id="model-texture-assignment-title" className="text-xs font-semibold">Model Texture assignment</h3>
            {materialInventory && (
              <span className="text-[10px] text-muted-foreground">
                {materialInventory.materialSlotCount} Texture slots detected
              </span>
            )}
            <input
              ref={materialTextureInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/bmp"
              className="hidden"
              onChange={handleTemporaryTexture}
            />
          </div>
          {materialInventory && materialInventory.slots.length > 0 && (
            <div className="mt-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[180px] flex-1">
                  <h4 className="text-xs font-semibold text-cyan-200">Assign Existing Texture</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Choose one master Model Texture and the App will assign it to every detected slot.
                  </p>
                </div>
                {textureLibrary.length > 0 ? (
                  <>
                    <select
                      aria-label="Select existing Model Texture"
                      className="h-8 min-w-[220px] rounded border bg-background px-2 text-xs"
                      value={quickTextureId}
                      onChange={(event) => {
                        setQuickTextureId(event.target.value);
                        const texture = textureLibrary.find((item) => item.id === Number(event.target.value));
                        const firstSlot = materialInventory.slots[0];
                        if (texture && firstSlot) {
                          setSelectedMaterialSlotId(firstSlot.id);
                          setMaterialPreviewOverride({
                            targetKey: firstSlot.id,
                            textureUrl: texture.filePath,
                            fileName: texture.fileName,
                          });
                        }
                      }}
                    >
                      <option value="">Select Existing Model Texture…</option>
                      {textureLibrary.filter((texture) => texture.id > 0).map((texture) => (
                        <option key={texture.id} value={texture.id}>
                          {texture.textureName} · {texture.assignmentCount} uses
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 bg-cyan-600 text-xs text-white hover:bg-cyan-500"
                      disabled={!quickTextureId || savingMaterialAssignment || materialInventory.omittedSlotCount > 0 || !onSaveMaterialAssignment}
                      onClick={async () => {
                        if (!quickTextureId || !onSaveMaterialAssignment) return;
                        setSavingMaterialAssignment(true);
                        setMaterialAssignmentError(null);
                        try {
                          await onSaveMaterialAssignment({
                            targetKeys: materialInventory.slots.map((slot) => slot.id),
                            textureId: Number(quickTextureId),
                          });
                        } catch (saveError) {
                          setMaterialAssignmentError(saveError instanceof Error ? saveError.message : 'Failed to assign Model Texture');
                        } finally {
                          setSavingMaterialAssignment(false);
                        }
                      }}
                    >
                      {savingMaterialAssignment ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                      Assign to all {materialInventory.slots.length} slots
                    </Button>
                  </>
                ) : (
                  <Button asChild type="button" size="sm" variant="outline" className="h-8 text-xs">
                    <a href="/admin/threed/model-textures">Open Model Textures</a>
                  </Button>
                )}
              </div>
            </div>
          )}
          {materialAssignmentError && <p className="mt-2 text-[10px] text-destructive">{materialAssignmentError}</p>}
          <details className="mt-2 rounded border border-border/60 bg-background/20 p-2">
            <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground">
              Advanced per-slot Texture assignments
            </summary>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                disabled={!selectedMaterialSlot}
                onClick={() => materialTextureInputRef.current?.click()}
              >
                <Upload className="mr-1 h-3 w-3" />
                Test Base Color file
              </Button>
            </div>
          {selectedMaterialSlot && (
            <p className="mt-2 text-[10px] text-cyan-300">
              Selected: {selectedMaterialSlot.meshPath} / {selectedMaterialSlot.materialName}
              {materialPreviewOverride?.targetKey === selectedMaterialSlot.id
                ? ` · temporary ${materialPreviewOverride.fileName}`
                : ' · choose an image to test this slot'}
            </p>
          )}
          {selectedMaterialSlot && (availableTextureAttachments.length > 0 || textureLibrary.length > 0) && (
            <div className="mt-2 flex items-center gap-2 rounded border border-cyan-500/20 bg-cyan-500/5 p-2">
              <label htmlFor="model-material-attachment" className="shrink-0 text-[10px] font-medium">
                Select Existing Model Texture
              </label>
              <select
                id="model-material-attachment"
                className="h-7 min-w-0 flex-1 rounded border bg-background px-2 text-[10px]"
                value={selectedLibraryTexture ? `library:${selectedLibraryTexture.id}` : selectedUploadedTexture ? `attachment:${selectedUploadedTexture.id}`
                  : ''}
                onChange={(event) => {
                  const [source, rawId] = event.target.value.split(':');
                  const id = Number(rawId);
                  const selected = source === 'library'
                    ? textureLibrary.find((texture) => texture.id === id)
                    : availableTextureAttachments.find((file) => file.id === id);
                  if (!selected) return;
                  setMaterialPreviewOverride({
                    targetKey: selectedMaterialSlot.id,
                    textureUrl: selected.filePath,
                    fileName: selected.fileName,
                  });
                }}
              >
                <option value="">Select an existing Model Texture…</option>
                {textureLibrary.length > 0 && <optgroup label="ThreeD Model Textures">
                  {textureLibrary.map((texture) => (
                    <option key={`library:${texture.id}`} value={`library:${texture.id}`}>
                      {texture.textureName} · used {texture.assignmentCount} times
                    </option>
                  ))}
                </optgroup>}
                {availableTextureAttachments.length > 0 && <optgroup label="Model attachments">
                {availableTextureAttachments.map((file) => (
                  <option key={`${file.relativePath}:${file.filePath}`} value={`attachment:${file.id}`}>
                    {file.relativePath || file.fileName}
                  </option>
                ))}
                </optgroup>}
              </select>
              {onSaveMaterialAssignment && (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 shrink-0 text-[10px]"
                  disabled={(!selectedUploadedTexture?.id && !selectedLibraryTexture?.id) || savingMaterialAssignment}
                  onClick={async () => {
                    if (!selectedUploadedTexture?.id && !selectedLibraryTexture?.id) return;
                    setSavingMaterialAssignment(true);
                    setMaterialAssignmentError(null);
                    try {
                      await onSaveMaterialAssignment({
                        targetKeys: [selectedMaterialSlot.id],
                        ...(selectedLibraryTexture?.id
                          ? { textureId: selectedLibraryTexture.id }
                          : { textureFileId: selectedUploadedTexture!.id }),
                      });
                    } catch (saveError) {
                      setMaterialAssignmentError(saveError instanceof Error ? saveError.message : 'Failed to save assignment');
                    } finally {
                      setSavingMaterialAssignment(false);
                    }
                  }}
                >
                  {savingMaterialAssignment ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  Save assignment
                </Button>
              )}
              {onSaveMaterialAssignment && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 shrink-0 text-[10px]"
                  disabled={(!selectedUploadedTexture?.id && !selectedLibraryTexture?.id) || savingMaterialAssignment || !materialInventory?.slots.length || materialInventory.omittedSlotCount > 0}
                  onClick={async () => {
                    if ((!selectedUploadedTexture?.id && !selectedLibraryTexture?.id) || !materialInventory?.slots.length) return;
                    setSavingMaterialAssignment(true);
                    setMaterialAssignmentError(null);
                    try {
                      await onSaveMaterialAssignment({
                        targetKeys: materialInventory.slots.map((slot) => slot.id),
                        ...(selectedLibraryTexture?.id
                          ? { textureId: selectedLibraryTexture.id }
                          : { textureFileId: selectedUploadedTexture!.id }),
                      });
                    } catch (saveError) {
                      setMaterialAssignmentError(saveError instanceof Error ? saveError.message : 'Failed to save assignments');
                    } finally {
                      setSavingMaterialAssignment(false);
                    }
                  }}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Save to all {materialInventory?.slots.length ?? 0} slots
                </Button>
              )}
            </div>
          )}
          {!materialInventory ? (
            <p className="mt-2 text-[10px] text-muted-foreground">Material slots will appear after the Model finishes loading.</p>
          ) : materialInventory.materialSlotCount === 0 ? (
            <p className="mt-2 text-[10px] text-muted-foreground">No mesh material slots were found in this Model.</p>
          ) : (
            <>
              <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {materialInventory.slots.map((slot) => (
                  <MaterialSlotRow
                    key={slot.id}
                    slot={slot}
                    selected={selectedMaterialSlotId === slot.id}
                    onSelect={() => selectMaterialSlot(slot)}
                    savedTextureRelativePath={savedMaterialOverrides.assignments.find((assignment) => (
                      assignment.targetKey === slot.id && assignment.channel === 'baseColor'
                    ))?.textureRelativePath}
                  />
                ))}
              </div>
              {materialInventory.omittedSlotCount > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {materialInventory.omittedSlotCount} additional slots omitted from this bounded inspection view.
                </p>
              )}
            </>
          )}
          </details>
        </section>
      )}
    </div>
  );
}
