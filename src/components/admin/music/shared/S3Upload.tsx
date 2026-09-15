'use client';
import { useEffect, useRef, useState } from 'react';
import { uploadPolicy, mediaTypes } from '@/lib/services/music/upload-policy';

export interface UploadedMedia { fileUrl: string; fileType: string; fileSize: number; fileName: string }
export function S3Upload({ kind, disabled, onUploaded, onBusyChange }: {
  kind: 'audio' | 'image' | 'media'; disabled?: boolean; onUploaded: (file: UploadedMedia) => void; onBusyChange: (busy: boolean) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function upload(file: File) {
    if (active.current) return;
    try { uploadPolicy(file.name, file.size, kind); } catch { setIsError(true); setMessage('Unsupported file type or size.'); return; }
    const controller = new AbortController(); active.current = controller;
    onBusyChange(true); setProgress(0); setMessage(''); setIsError(false);
    const details = { name: file.name, size: file.size, kind };
    const api = async (body: object) => {
      const response = await fetch('/api/music/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      const data = await response.json(); if (!response.ok) throw Error(data.error || 'Upload failed.'); return data;
    };
    try {
      const start = await api({ ...details, action: 'start' });
      if (controller.signal.aborted) return;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', start.url); xhr.setRequestHeader('Content-Type', start.contentType);
        xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(Error('S3 rejected the upload.'));
        xhr.onerror = () => reject(Error('Upload failed. Check connection and S3 CORS settings.'));
        xhr.onabort = () => reject(Error('Upload cancelled.'));
        controller.signal.addEventListener('abort', () => xhr.abort(), { once: true });
        xhr.send(file);
      });
      const result = await api({ ...details, action: 'complete', key: start.key });
      if (!controller.signal.aborted) { onUploaded({ ...result, fileName: file.name }); setMessage('Uploaded. Save this form to attach the file.'); }
    } catch (error) {
      if (!controller.signal.aborted) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : 'Upload failed.');
      }
    }
    finally { if (!controller.signal.aborted) setProgress(null); active.current = null; onBusyChange(false); }
  }
  const accept = Object.entries(mediaTypes).filter(([,type]) => kind === 'media' || type.startsWith(`${kind}/`)).map(([ext]) => `.${ext}`).join(',');
  return <div className="space-y-1 rounded border p-2">
    <label className="block text-xs">Upload to S3
      <input type="file" accept={accept} disabled={disabled || progress !== null} className="mt-1 block w-full text-xs" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} />
    </label>
    <p className="text-xs text-muted-foreground">{kind === 'image' ? 'Cover art up to 20 MiB' : 'Files up to 512 MiB'} · private storage</p>
    {progress !== null && <p role="status" className="text-xs">{progress === 100 ? 'Verifying upload…' : `Uploading ${progress}%`}</p>}
    {message && <p role={isError ? 'alert' : 'status'} className={`text-xs ${isError ? 'text-red-500' : 'text-emerald-500'}`}>{message}</p>}
  </div>;
}
