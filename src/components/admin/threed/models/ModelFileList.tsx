// src/components/admin/threed/models/ModelFileList.tsx — v0.16.4-beta
// Shared presentational component: renders a model's associated files grouped by type
// (model / texture / binary / other / supportive media).
'use client';

import { Box, Image, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ModelFileRow {
  id: number;
  fileName: string;
  fileType: string;
  textureType: string | null;
  filePath: string;
  fileSize: number | null;
  isBinaryBuffer: boolean;
  loadOrder: number;
  createdAt?: string;
}

const LABELS: Record<string, string> = {
  model: 'Model Files',
  texture: 'Textures',
  binary: 'Binary Buffers',
  other: 'Supportive Media',
};

function FileIcon({ type }: { type: string }) {
  if (type === 'model') return <Box className="w-3.5 h-3.5 text-blue-500" />;
  if (type === 'texture') return <Image className="w-3.5 h-3.5 text-green-500" />;
  if (type === 'binary') return <File className="w-3.5 h-3.5 text-orange-500" />;
  return <File className="w-3.5 h-3.5 text-gray-500" />;
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ModelFileList({ files, emptyText = 'No files attached to this model' }: { files: ModelFileRow[]; emptyText?: string }) {
  if (!files || files.length === 0) {
    return <p className="text-[11px] text-muted-foreground">{emptyText}</p>;
  }

  const groups: Record<string, ModelFileRow[]> = { model: [], texture: [], binary: [], other: [] };
  for (const f of files) {
    const key = groups[f.fileType] ? f.fileType : 'other';
    groups[key].push(f);
  }

  return (
    <div className="space-y-2 rounded border border-dashed p-2">
      {(['model', 'texture', 'binary', 'other'] as const).map((type) => {
        const group = groups[type];
        if (group.length === 0) return null;
        return (
          <div key={type}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
              {LABELS[type]} ({group.length})
            </div>
            <div className="space-y-0.5">
              {group.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <FileIcon type={f.fileType} />
                  <span className="truncate flex-1">{f.fileName}</span>
                  {f.textureType && <Badge variant="outline" className="text-[9px] h-4 px-1">{f.textureType}</Badge>}
                  <span className="text-[10px] shrink-0">{formatSize(f.fileSize)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}