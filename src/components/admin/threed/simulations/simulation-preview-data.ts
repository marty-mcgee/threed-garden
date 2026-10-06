import type { ComponentProps } from 'react';
import type { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import type { CharacterAnimationMapping } from '@/libraries/utils/assignedCharacterAnimations';
import { modelForPreview } from '../models/model-preview-requirements';
import type { SimulationChoices } from './SimulationDefinitionEditor';

export type PreviewMarker = SimulationChoices['markers'][number];
export type PreviewCharacter = ComponentProps<typeof GardenCharacter>['character'];
export type PreviewMapping = Omit<CharacterAnimationMapping, 'slots'> & { slots?: { actionKey: string; name: string; isActive: boolean }[] };
export type SimulationPreviewAsset = { marker: PreviewMarker; model?: ModelData; character?: PreviewCharacter; mapping?: PreviewMapping; error?: string };

/** Read selected sources only; cached promises deduplicate reusable Models within a preview. */
export async function loadSimulationPreviewAssets(markers: PreviewMarker[], signal: AbortSignal, request: typeof fetch = fetch): Promise<SimulationPreviewAsset[]> {
  const cache = new Map<string, Promise<unknown>>();
  function get<T>(url: string, exactId?: number, allowMissing = false): Promise<T> {
    if (!cache.has(url)) cache.set(url, (async () => {
      const response = await request(url, { signal, cache: 'no-store' });
      const result = await response.json();
      if (allowMissing && response.status === 404) return null;
      if (!response.ok || !result.success || !result.data || (exactId !== undefined && result.data.id !== exactId)) throw new Error(result.error || 'Preview source unavailable.');
      return result.data;
    })());
    return cache.get(url)! as Promise<T>;
  }
  const result: SimulationPreviewAsset[] = new Array(markers.length);
  let cursor = 0;
  // Four workers keep large Action definitions from starting unbounded asset requests.
  await Promise.all(Array.from({ length: Math.min(4, markers.length) }, async () => {
    while (cursor < markers.length && !signal.aborted) {
      const index = cursor++, marker = markers[index], pose = marker.preview;
      try {
        if (!pose) throw new Error('Saved position or source is unavailable.');
        if (!pose.visible) throw new Error('This Project marker is hidden or inactive.');
        if (marker.markerType !== 'characters' && marker.markerType !== 'models') { result[index] = { marker }; continue; }
        if (marker.markerType === 'models') {
          const source = await get<ModelData>(`/api/threed/models?id=${pose.sourceAssetId}`, pose.sourceAssetId);
          const model = modelForPreview({ ...source, scale: Number(source.scale ?? 1) * pose.scaleMultiplier, animationSpeed: 0 });
          result[index] = { marker, model }; continue;
        }
        const source = await get<PreviewCharacter>(`/api/threed/characters?id=${pose.sourceAssetId}`, pose.sourceAssetId);
        const modelId = pose.modelId ?? source.modelId;
        if (typeof modelId !== 'number' || !Number.isSafeInteger(modelId) || modelId <= 0) throw new Error('Assign a Model to this Character for preview.');
        const savedModel = await get<ModelData>(`/api/threed/models?id=${modelId}`, modelId);
        // Match the saved Character resource path, including exact authorized FBX filename aliases.
        const model = modelForPreview(savedModel, true);
        const own = await get<PreviewMapping>(`/api/threed/animation-assignments?target=character&targetId=${pose.sourceAssetId}`);
        // Preserve Character overrides when a Project instance uses another Model.
        const inherited = own.modelId === modelId ? null : await get<PreviewMapping | null>(`/api/threed/animation-assignments?target=model&targetId=${modelId}`, undefined, true);
        const mapping: PreviewMapping = own.modelId !== modelId ? { ...own, modelId, inherited: inherited?.assignments ?? [], animations: [...own.animations, ...(inherited?.animations ?? [])] } : own;
        const character: PreviewCharacter = { ...source, id: pose.sourceAssetId, name: marker.name, modelId,
          model: { ...model, scale: String(model.scale ?? 1), rotationY: String(model.rotationY ?? 0), animations: Array.isArray(model.animations) ? model.animations : [],
            metadata: model.metadata && typeof model.metadata === 'object' && !Array.isArray(model.metadata) ? { ...(model.metadata as Record<string, unknown>) } : undefined },
          sceneAnimationMapping: mapping, positionX: 0, positionY: 0, positionZ: 0, rotation: pose.rotation[1] * 180 / Math.PI,
          scale: (pose.characterScale ?? Number(source.scale ?? 1)) * pose.scaleMultiplier,
          animationSpeed: 1, movementType: 'stationary', movementSpeed: 0, movementRadius: 0,
          interactable: false, visible: true, status: 'active', activeStartHour: null, activeEndHour: null };
        result[index] = { marker, model, character, mapping };
      } catch (cause) { result[index] = { marker, error: cause instanceof Error ? cause.message : 'Preview source unavailable.' }; }
    }
  }));
  if (signal.aborted) throw new DOMException('Preview cancelled.', 'AbortError');
  return result;
}
