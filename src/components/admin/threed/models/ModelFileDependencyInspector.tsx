'use client';

import { useEffect, useState } from 'react';
import { inspectThreeDModelPrimary, inspectThreeDModelMaterial, type ThreeDModelCompanionRequirement } from '@/libraries/services/threed/models/model-companion-core';
import type { ModelResourceAudit } from './ModelResourceInventory';

export function ModelFileDependencyInspector({ file, savedFile, audit }: {
  file: File | null;
  savedFile: { id: number; fileName: string; fileType: string; filePath: string; fileSize: number | null } | null;
  audit: ModelResourceAudit | null;
}) {
  const [requirements, setRequirements] = useState<ThreeDModelCompanionRequirement[]>([]);
  const [status, setStatus] = useState('');
  const name = file?.name ?? savedFile?.fileName ?? '';
  const inspectable = /\.(mtl|obj|gltf|glb|fbx)$/i.test(name);
  const sourceUrl = savedFile?.filePath;
  const bytes = file?.size ?? savedFile?.fileSize ?? 0;
  useEffect(() => {
    const controller = new AbortController(); setRequirements([]); setStatus('');
    if (!inspectable) return;
    if (bytes <= 0 || bytes > 4 * 1024 * 1024) { setStatus('Dependency text inspection supports nonempty files up to 4 MiB.'); return; }
    if (!file && (!sourceUrl || !/^https:\/\//i.test(sourceUrl))) { setStatus('A valid saved URL is required for inspection.'); return; }
    setStatus('Inspecting file references…');
    void (async () => {
      try {
        let buffer: ArrayBuffer;
        if (file) buffer = await file.arrayBuffer();
        else {
          const response = await fetch(sourceUrl!, { signal: controller.signal });
          if (!response.ok) throw new Error('Saved file could not be read.');
          buffer = await response.arrayBuffer();
        }
        if (buffer.byteLength > 4 * 1024 * 1024) throw new Error('File exceeds the inspection limit.');
        const found = /\.mtl$/i.test(name)
          ? inspectThreeDModelMaterial(name, new TextDecoder().decode(buffer), savedFile && audit?.requirements.find(item => item.matchedFileId === savedFile.id)?.relativePath || name)
          : inspectThreeDModelPrimary(name, new Uint8Array(buffer));
        if (controller.signal.aborted) return;
        setRequirements(found); setStatus(found.length ? 'Declared file references (not saved attachments)' : 'No external references detected by this inspection.');
      } catch (cause) { if (!controller.signal.aborted) setStatus(cause instanceof Error ? cause.message : 'File inspection unavailable.'); }
    })();
    return () => controller.abort();
  }, [file, sourceUrl, name, bytes, inspectable, savedFile, audit]);
  if (!name) return null;
  const uses = savedFile ? audit?.requirements.filter(item => item.matchedFileId === savedFile.id) ?? [] : [];
  return <section aria-label="File dependency inspector" className="space-y-2 rounded border p-3 text-xs">
    <h3 className="font-semibold">File inspector · {name}</h3>
    <p>{bytes} bytes · {file ? 'Local candidate' : savedFile?.fileType}</p>
    {status && <p role="status">{status}</p>}
    {requirements.length > 0 && <ul className="space-y-1 break-all">{requirements.map(item => <li key={`${item.kind}:${item.relativePath}`}>{item.relativePath} · {item.kind}</li>)}</ul>}
    {uses.length > 0 && <ul className="space-y-1 break-all">{uses.map(item => <li key={`${item.kind}:${item.relativePath}`}>Saved dependency for {item.referencedBy ?? 'parent geometry'}: {item.relativePath}</li>)}</ul>}
    {/\.fbx$/i.test(name) && <p>FBX filename scanning cannot certify embedded resources or full dependency coverage.</p>}
    {/\.bin$/i.test(name) && <p>Binary buffer; appearance is reviewed on the parent Model Canvas.</p>}
    {/\.mtl$/i.test(name) && <p>OBJ material library; its image references are dependencies, not standalone geometry.</p>}
  </section>;
}
