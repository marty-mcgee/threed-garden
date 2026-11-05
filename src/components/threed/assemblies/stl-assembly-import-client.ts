import { buildThreeDModelAdminPayload, createEmptyThreeDModelAdminForm } from '@/components/admin/threed/models/model-admin-form-core';
import { parseAssemblyDefinition, type AssemblyDefinition } from '@/libraries/services/threed/models/assembly-group-core';
import { threeDModelUploadPolicy } from '@/libraries/services/threed/models/model-upload-policy-core';
import type { ThreeDPrimaryUploadResult } from '@/libraries/services/threed/models/model-primary-upload-client';
import type { StlPartsConversion } from '@/libraries/services/threed/models/stl-parts-import';

export interface StlAssemblyImportPart {
  id: string;
  label: string;
  position: [number, number, number];
  file: File;
  upload?: ThreeDPrimaryUploadResult;
  modelId?: number;
  saveUnknown: boolean;
  cleanupUnknown: boolean;
}

/** A retained, account-bound receipt. Completed writes are never replayed on retry. */
export interface StlAssemblyImportProgress {
  id: string;
  ownerId: string;
  name: string;
  sourceName: string;
  parts: StlAssemblyImportPart[];
  running: boolean;
  assemblyUnknown: boolean;
  saved?: AssemblyDefinition;
  status: string;
}

export interface StlAssemblyImportBoundary {
  fetch: typeof fetch;
  upload: (file: File) => Promise<ThreeDPrimaryUploadResult>;
  currentOwner: () => string | undefined;
  onChange: () => void;
  shouldPause?: () => boolean;
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function message(reply: unknown, fallback: string) {
  const error = object(reply).error;
  return typeof error === 'string' ? error : fallback;
}

function checkOwner(progress: StlAssemblyImportProgress, boundary: StlAssemblyImportBoundary) {
  if (boundary.currentOwner() !== progress.ownerId) throw new Error('The signed-in account changed. This import has stopped. Saved records remain with their owner.');
}

function definitelyRejected(response: Response) {
  return [400, 401, 403, 413, 422].includes(response.status);
}

export function createStlAssemblyImportProgress(
  ownerId: string,
  name: string,
  sourceName: string,
  conversion: StlPartsConversion,
): StlAssemblyImportProgress {
  if (conversion.omittedIslandIds.length) throw new Error('Review all detected islands before importing this Assembly.');
  const stem = sourceName.replace(/\.stl$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'stl-assembly';
  const progress: StlAssemblyImportProgress = {
    id: crypto.randomUUID(),
    ownerId,
    name: name.trim(),
    sourceName,
    parts: conversion.parts.map((part, index) => {
      const file = new File([part.bytes], `${stem}-part-${index + 1}.glb`, { type: 'model/gltf-binary' });
      threeDModelUploadPolicy(file.name, file.size);
      return {
        id: crypto.randomUUID(),
        label: part.label.trim(),
        position: [...part.position],
        file,
        saveUnknown: false,
        cleanupUnknown: false,
      };
    }),
    running: false,
    assemblyUnknown: false,
    status: 'Ready to create Models and Assembly.',
  };
  // Validate all names and transforms before the first storage or database write.
  definitionFor(progress, true);
  return progress;
}

function definitionFor(progress: StlAssemblyImportProgress, validateBeforeSave = false) {
  return parseAssemblyDefinition({
    formatVersion: 1,
    id: progress.id,
    ownerId: progress.ownerId,
    name: progress.name,
    revision: 1,
    components: progress.parts.map(part => ({
      id: part.id,
      modelId: validateBeforeSave ? 1 : part.modelId,
      label: part.label,
      transform: {
        position: {
          x: part.position[0],
          y: part.position[1],
          z: part.position[2],
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0,
        },
        scale: 1,
      },
    })),
  });
}

function verifiedModelId(data: unknown, progress: StlAssemblyImportProgress, part: StlAssemblyImportPart) {
  const model = object(data);
  if (!part.upload || !Number.isSafeInteger(model.id) || Number(model.id) <= 0
    || model.userId !== progress.ownerId || model.modelName !== part.label
    || model.modelType !== 'glb' || model.filePath !== part.upload.url || model.fileSize !== part.upload.fileSize
    || !Number.isSafeInteger(model.mainModelFileId) || Number(model.mainModelFileId) <= 0
    || Number(model.scale) !== 1 || Number(model.rotationY) !== 0
    || Number(model.offsetX) !== 0 || Number(model.offsetY) !== 0 || Number(model.offsetZ) !== 0
    || model.isActive !== true || model.status !== 'active') {
    throw new Error('This Model does not match the imported part, primary GLB, owner and original transform. Keep the import open and review the saved Model.');
  }
  return Number(model.id);
}

function verifyAssembly(data: unknown, expected: AssemblyDefinition) {
  const saved = parseAssemblyDefinition(data);
  if (JSON.stringify(saved) !== JSON.stringify(expected)) throw new Error('The saved Assembly does not match this import. No existing Assembly was replaced.');
  return saved;
}

/** Explicit recovery after a lost Model-create response; never chooses a Model by name alone. */
export async function recoverStlAssemblyImportModel(
  progress: StlAssemblyImportProgress,
  partId: string,
  modelId: number,
  boundary: StlAssemblyImportBoundary,
) {
  if (progress.running) return;
  checkOwner(progress, boundary);
  const part = progress.parts.find(candidate => candidate.id === partId);
  if (!part?.saveUnknown || !part.upload || !Number.isSafeInteger(modelId) || modelId <= 0) throw new Error('Enter the saved Model ID for this interrupted part.');
  progress.running = true;
  boundary.onChange();
  try {
    const response = await boundary.fetch(`/api/threed/models?id=${modelId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const reply = await response.json();
    checkOwner(progress, boundary);
    if (!response.ok || !object(reply).success) throw new Error(message(reply, 'Could not read this saved Model.'));
    const id = verifiedModelId(object(reply).data, progress, part);
    if (id !== modelId || progress.parts.some(candidate => candidate !== part && candidate.modelId === id)) throw new Error('Choose the distinct Model saved for this part.');
    part.modelId = id;
    part.saveUnknown = false;
    progress.status = `${part.label}: saved Model #${id} matched. Continue the import.`;
  } finally {
    progress.running = false;
    boundary.onChange();
  }
}

/** Called only by the explicit save action. No transport is invoked during local review. */
export async function saveStlAssemblyImport(progress: StlAssemblyImportProgress, boundary: StlAssemblyImportBoundary): Promise<AssemblyDefinition | null> {
  if (progress.running) return null;
  checkOwner(progress, boundary);
  if (progress.saved) return progress.saved;
  if (progress.parts.some(part => part.saveUnknown)) throw new Error('Match the saved Model for the interrupted part before continuing. It will not be created twice.');
  if (progress.parts.some(part => part.cleanupUnknown)) throw new Error('Staged upload cleanup is unconfirmed. Review the storage upload before starting another import; saved Models are retained.');
  progress.running = true;
  boundary.onChange();
  try {
    for (let index = 0; index < progress.parts.length; index += 1) {
      checkOwner(progress, boundary);
      if (boundary.shouldPause?.()) {
        progress.status = 'Import paused. Completed parts are retained; Continue import resumes the remaining work.';
        return null;
      }
      const part = progress.parts[index];
      if (part.modelId) continue;
      if (!part.upload) {
        progress.status = `Uploading part ${index + 1} of ${progress.parts.length}: ${part.label}`;
        boundary.onChange();
        try {
          part.upload = await boundary.upload(part.file);
        } catch (error) {
          part.cleanupUnknown = object(error).cleanupUnconfirmed === true;
          throw error;
        }
        // Retain the verified URL even if the account changes before the next write.
        boundary.onChange();
        checkOwner(progress, boundary);
      }
      const upload = part.upload;
      const payload = {
        ...buildThreeDModelAdminPayload({
          ...createEmptyThreeDModelAdminForm(),
          modelName: part.label,
          modelType: upload.modelType,
          filePath: upload.url,
          fileSize: String(upload.fileSize),
        }),
        primaryFile: {
          fileName: upload.fileName,
          filePath: upload.url,
          fileSize: upload.fileSize,
          modelType: upload.modelType,
        },
      };
      progress.status = `Saving part ${index + 1} of ${progress.parts.length}: ${part.label}`;
      part.saveUnknown = true;
      boundary.onChange();
      try {
        const response = await boundary.fetch('/api/threed/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(120_000),
        });
        if (definitelyRejected(response)) part.saveUnknown = false;
        const reply = await response.json();
        checkOwner(progress, boundary);
        if (!response.ok || !object(reply).success) throw new Error(message(reply, 'Could not save this Model.'));
        part.modelId = verifiedModelId(object(reply).data, progress, part);
        part.saveUnknown = false;
        boundary.onChange();
      } catch (error) {
        if (part.saveUnknown) throw new Error(`The save response for “${part.label}” is unconfirmed. Check All Models and enter its saved Model ID below before continuing. No duplicate Model will be created.`);
        throw error;
      }
    }
    checkOwner(progress, boundary);
    if (boundary.shouldPause?.()) {
      progress.status = 'All Models are saved. Continue import to save the Assembly.';
      return null;
    }
    const definition = definitionFor(progress);
    if (progress.assemblyUnknown) {
      progress.status = 'Checking the previous Assembly save…';
      boundary.onChange();
      const response = await boundary.fetch(`/api/threed/assembly-groups?id=${encodeURIComponent(progress.id)}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
      const reply = await response.json();
      checkOwner(progress, boundary);
      if (response.ok && object(reply).success) {
        progress.saved = verifyAssembly(object(reply).data, definition);
        progress.assemblyUnknown = false;
        return progress.saved;
      }
      if (response.status !== 404) throw new Error(message(reply, 'Could not confirm the previous Assembly save. Retry checks it before creating anything.'));
    }
    progress.status = 'Saving Assembly Group…';
    progress.assemblyUnknown = true;
    boundary.onChange();
    const response = await boundary.fetch('/api/threed/assembly-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        definition,
        expectedRevision: 0,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (definitelyRejected(response)) progress.assemblyUnknown = false;
    const reply = await response.json();
    checkOwner(progress, boundary);
    if (!response.ok || !object(reply).success) throw new Error(message(reply, 'Assembly save was not confirmed. Retry will check the saved Assembly first.'));
    progress.saved = verifyAssembly(object(reply).data, definition);
    progress.assemblyUnknown = false;
    progress.status = 'Models and Assembly saved.';
    return progress.saved;
  } finally {
    progress.running = false;
    boundary.onChange();
  }
}

export function stlAssemblyImportReceipt(progress: StlAssemblyImportProgress) {
  return {
    assemblyId: progress.id,
    ownerId: progress.ownerId,
    name: progress.name,
    sourceName: progress.sourceName,
    assemblySaveUnconfirmed: progress.assemblyUnknown,
    savedAssemblyId: progress.saved?.id ?? null,
    parts: progress.parts.map(part => ({
      label: part.label,
      modelId: part.modelId ?? null,
      fileName: part.file.name,
      uploadedFileUrl: part.upload?.url ?? null,
      modelSaveUnconfirmed: part.saveUnknown,
      uploadCleanupUnconfirmed: part.cleanupUnknown,
    })),
  };
}
