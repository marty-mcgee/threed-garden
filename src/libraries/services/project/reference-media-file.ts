export interface ProjectReferenceFile {
  id: number;
  name: string;
  src: string;
  kind: 'image' | 'video';
}

export function referenceMediaUrl(path: string, origin: string) {
  if (!path) return undefined;
  try {
    const url = new URL(path, origin);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function referenceMediaFile(item: {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
}, origin: string): ProjectReferenceFile | undefined {
  if (typeof item.fileType !== 'string' || typeof item.fileName !== 'string' || typeof item.fileUrl !== 'string') return;
  const kind = item.fileType.startsWith('image/') ? 'image' : item.fileType.startsWith('video/') ? 'video' : undefined;
  const src = referenceMediaUrl(item.fileUrl, origin);
  if (kind && src) return {
    id: item.id,
    name: item.fileName,
    src,
    kind,
  };
}
