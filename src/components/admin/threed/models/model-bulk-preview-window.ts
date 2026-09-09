import {
  MAX_BULK_FILE_BYTES, validateBulkCompanion, validateBulkPrimary,
  type BulkDraft, type BulkPreparedModel,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './model-bulk-preparation-core.ts';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { normalizeThreeDModelRelativePath } from '../../../../lib/services/threed/models/model-companion-core.ts';

export const BULK_PREVIEW_MESSAGE = 'threed-model-import-preview';
export const BULK_PREVIEW_PATH = '/threed/model-import-preview';

export interface BulkModelPreviewSnapshot {
  file: File;
  modelName: string;
  attachments: Array<{ file: File; relativePath: string }>;
  scale: number;
  rotationY: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  existingTextureId: number | null;
  missingTexturePaths: string[];
}

/** A preview receives only the selected local bundle and its visual settings. */
export function createBulkModelPreviewSnapshot(draft: BulkDraft, plan: BulkPreparedModel): BulkModelPreviewSnapshot {
  const transform = (value: string) => value.trim() ? Number(value) : Number.NaN;
  const snapshot = {
    file: draft.source.file,
    modelName: draft.modelName.trim() || draft.source.file.name,
    attachments: plan.attachments.map(({ source, relativePath }) => ({ file: source.file, relativePath })),
    scale: transform(plan.settings.scale), rotationY: transform(draft.rotationY),
    offsetX: transform(draft.offsetX), offsetY: transform(draft.offsetY), offsetZ: transform(draft.offsetZ),
    existingTextureId: plan.settings.existingTextureId,
    missingTexturePaths: [...new Set(plan.matches.filter((match) => match.requirement.kind === 'texture'
      && (match.issue || !match.sourceId)).map((match) => match.requirement.relativePath))],
  };
  validateBulkModelPreviewSnapshot(snapshot);
  return snapshot;
}

export function validateBulkModelPreviewSnapshot(value: unknown): asserts value is BulkModelPreviewSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Choose a Model in the importer first.');
  const data = value as Partial<BulkModelPreviewSnapshot>;
  if (!(data.file instanceof File) || validateBulkPrimary(data.file)) throw new Error('Choose a supported Model file up to 4 MiB.');
  if (typeof data.modelName !== 'string' || data.modelName.length > 255) throw new Error('Use a Model name up to 255 characters.');
  if (![data.scale, data.rotationY, data.offsetX, data.offsetY, data.offsetZ].every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    || Number(data.scale) < 0.01) throw new Error('Enter a scale of at least 0.01 and finite rotation/offset values before previewing.');
  if (data.existingTextureId !== null && (!Number.isSafeInteger(data.existingTextureId) || Number(data.existingTextureId) <= 0)) throw new Error('Choose an available existing Texture or None.');
  if (!Array.isArray(data.attachments) || data.attachments.length > 500) throw new Error('The preview supports up to 500 companion files.');
  let bytes = data.file.size;
  for (const attachment of data.attachments) {
    if (!attachment || !(attachment.file instanceof File) || validateBulkCompanion(attachment.file)
      || typeof attachment.relativePath !== 'string' || attachment.relativePath.length > 356
      || normalizeThreeDModelRelativePath(attachment.relativePath) !== attachment.relativePath) {
      throw new Error('Review the selected companion files and their destinations before previewing.');
    }
    bytes += attachment.file.size;
  }
  if (bytes > 8 * MAX_BULK_FILE_BYTES) throw new Error('Selected preview files exceed the 32 MiB bundle limit.');
  if (!Array.isArray(data.missingTexturePaths) || data.missingTexturePaths.length > 500
    || data.missingTexturePaths.some((path) => typeof path !== 'string' || path.length > 1024)) throw new Error('The preview has invalid texture requirements.');
}

/** Open synchronously from a click so browser popup policies can allow it. */
export function openBulkModelPreview(snapshot: BulkModelPreviewSnapshot, onError: (message: string) => void): () => void {
  validateBulkModelPreviewSnapshot(snapshot);
  const token = crypto.randomUUID();
  const origin = window.location.origin;
  const popup = window.open(`${BULK_PREVIEW_PATH}?token=${encodeURIComponent(token)}`, 'threed-model-import-preview', 'popup,width=1200,height=900');
  if (!popup) throw new Error('Allow popups for this App, then choose Preview Model again.');
  let finished = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener('message', receive);
    window.removeEventListener('pagehide', cleanup);
    window.clearTimeout(timeout);
    window.clearInterval(closedCheck);
  };
  const receive = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== popup || event.data?.channel !== BULK_PREVIEW_MESSAGE || event.data.token !== token) return;
    if (event.data.type === 'ready') {
      popup.postMessage({ channel: BULK_PREVIEW_MESSAGE, token, type: 'model', snapshot }, origin);
    } else if (event.data.type === 'received') cleanup();
  };
  const timeout = window.setTimeout(() => { cleanup(); onError('The preview window did not become ready. Choose Preview Model again.'); }, 60_000);
  const closedCheck = window.setInterval(() => { if (popup.closed) cleanup(); }, 500);
  window.addEventListener('message', receive);
  window.addEventListener('pagehide', cleanup);
  popup.focus();
  return cleanup;
}
