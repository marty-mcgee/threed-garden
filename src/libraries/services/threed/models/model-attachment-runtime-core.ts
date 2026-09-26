import { normalizeThreeDModelRelativePath } from './model-companion-core';

export interface ThreeDModelRuntimeAttachment {
  id?: number;
  fileName: string;
  relativePath: string;
  filePath: string;
  fileType: string;
}

function decodedRequestPath(requestUrl: string): string {
  const slashPath = requestUrl.trim().replaceAll('\\', '/');
  try {
    return decodeURIComponent(new URL(slashPath).pathname).replace(/^\/+/, '');
  } catch {
    try {
      return decodeURIComponent(slashPath).replace(/^\/+/, '');
    } catch {
      return slashPath.replace(/^\/+/, '');
    }
  }
}

/**
 * Resolve a loader dependency request to one attached Blob. Exact relative-path
 * matches win. A filename fallback is allowed only when that filename is unique
 * within the Model, which supports FBX exports containing workstation paths
 * without guessing between same-named textures in different directories.
 */
export function resolveThreeDModelAttachmentUrl(
  requestUrl: string,
  attachments: readonly ThreeDModelRuntimeAttachment[],
): string {
  if (/^(?:data|blob):/i.test(requestUrl)) return requestUrl;

  const candidates = attachments.flatMap((attachment) => {
    if (attachment.fileType === 'model' || attachment.fileType === 'animation') return [];
    const relativePath = normalizeThreeDModelRelativePath(
      attachment.relativePath || attachment.fileName,
    );
    if (!relativePath || !/^https:\/\//i.test(attachment.filePath)) return [];
    return [{
      ...attachment,
      relativePath,
      lowerRelativePath: relativePath.toLowerCase(),
      lowerFileName: attachment.fileName.toLowerCase(),
    }];
  });
  if (!candidates.length) return requestUrl;

  const requestPath = decodedRequestPath(requestUrl);
  const lowerRequestPath = requestPath.toLowerCase();
  const exact = candidates.find(({ lowerRelativePath }) => (
    lowerRequestPath === lowerRelativePath
    || lowerRequestPath.endsWith(`/${lowerRelativePath}`)
  ));
  if (exact) return exact.filePath;

  const requestedFileName = requestPath.split('/').at(-1)?.toLowerCase() ?? '';
  if (!requestedFileName) return requestUrl;
  const filenameMatches = candidates.filter(({ lowerFileName, lowerRelativePath }) => (
    lowerFileName === requestedFileName
    || lowerRelativePath.split('/').at(-1) === requestedFileName
  ));
  return filenameMatches.length === 1 ? filenameMatches[0].filePath : requestUrl;
}
