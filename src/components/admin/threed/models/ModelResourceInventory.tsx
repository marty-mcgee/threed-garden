import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';

export interface ModelResourceAudit {
  status: 'analyzed' | 'missing_primary' | 'not_required' | 'not_supported';
  requirements: Array<{ kind: string; relativePath: string; satisfied: boolean; matchedFileId?: number | null; referencedBy?: string }>;
  embeddedResources?: { status: 'inspected' | 'not_inspected'; buffers: number; images: number };
}

export function ModelResourceInventory({ model, audit, loading, error, textureLibrary = [], selectedFileId }: {
  model: ModelData & { mainModelFileId: number | null };
  audit: ModelResourceAudit | null;
  loading: boolean;
  error: string | null;
  textureLibrary?: Array<{ id: number; filePath: string; textureName: string }>;
  selectedFileId?: number;
}) {
  const primary = model.files?.find(file => file.id === model.mainModelFileId && file.fileType === 'model');
  const alternateGeometry = model.files?.filter(file => file !== primary && file.fileType === 'model') ?? [];
  const supporting = model.files?.filter(file => file.fileType !== 'model') ?? [];
  const assignments = model.materialAssignments ?? [];
  const linked = textureLibrary.filter(texture => assignments.some(assignment => assignment.textureId === texture.id)
    || model.files?.some(file => file.fileType === 'texture' && file.filePath === texture.filePath));
  const otherAssignments = assignments.filter(assignment => !linked.some(texture => texture.id === assignment.textureId));
  const embedded = audit?.embeddedResources;
  const fileLink = (file: NonNullable<ModelData['files']>[number]) => <Link className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 break-all font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-current={file.id === selectedFileId ? 'page' : undefined} href={`/admin/threed/models/${model.id}/files/${file.id}`}><span>{file.fileName}</span><span className="text-muted-foreground">#{file.id}</span>{file.id === selectedFileId && <Badge variant="outline" className="text-[10px]">Selected File</Badge>}</Link>;
  return <section aria-label="Model resource inventory" className="space-y-3 rounded-lg border admin-editor-panel p-3 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Resource inventory</h2>
      <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs"><Link href={`/admin/threed/models/${model.id}/files/new`}><Plus className="h-3.5 w-3.5" />Add File</Link></Button></div>
    <p className="text-muted-foreground">Parent Model #{model.id} · {model.modelName}. Primary geometry is the Model’s default file; other geometry files are separate saved choices.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0 space-y-1.5 rounded-md border admin-editor-panel p-2.5"><h3 className="font-semibold">Primary geometry</h3>{primary ? fileLink(primary)
        : <p className="text-muted-foreground">{model.modelType === 'procedural' && model.mainModelFileId === null ? 'Procedural shape · no primary File required' : 'No valid saved primary File'}</p>}</div>
      <div className="min-w-0 space-y-1.5 rounded-md border admin-editor-panel p-2.5"><h3 className="font-semibold">Other geometry files ({alternateGeometry.length})</h3>
        {alternateGeometry.length ? <ul className="space-y-2">{alternateGeometry.map(file => <li key={file.id}>{fileLink(file)}</li>)}</ul> : <p className="text-muted-foreground">No alternate geometry</p>}</div>
      <div className="min-w-0 space-y-1.5 rounded-md border admin-editor-panel p-2.5"><h3 className="font-semibold">Supporting attachments ({supporting.length})</h3>
        {supporting.length ? <ul className="space-y-2">{supporting.map(file => <li key={file.id}>{fileLink(file)} <span className="text-muted-foreground">· {file.fileType}</span></li>)}</ul> : <p className="text-muted-foreground">No saved supporting attachments</p>}</div>
      <div className="min-w-0 space-y-1.5 rounded-md border admin-editor-panel p-2.5"><h3 className="font-semibold">Linked Texture records</h3>
        {linked.length || otherAssignments.length ? <ul className="space-y-1">
          {linked.map(texture => <li key={texture.id}>{texture.textureName} · Texture #{texture.id}{assignments.some(assignment => assignment.textureId === texture.id) ? ' · material assignment' : ' · shared attachment URL'}</li>)}
          {otherAssignments.map(assignment => <li key={`${assignment.targetKey}:${assignment.channel}`}>{assignment.textureName} · Texture #{assignment.textureId} · {assignment.targetKey}</li>)}
        </ul> : <p className="text-muted-foreground">No linked records identified</p>}
        <p className="text-xs text-muted-foreground">Library filename suggestions are not saved links.</p></div>
      <details className="min-w-0 space-y-1.5 rounded-md border admin-editor-panel p-2.5 sm:col-span-2"><summary className="cursor-pointer font-semibold">Embedded resources</summary><p className="text-muted-foreground">
        {loading ? 'Inspecting saved geometry…' : embedded?.status === 'inspected'
          ? `${embedded.buffers} embedded buffer(s) · ${embedded.images} embedded image(s), declared inside the geometry File`
          : audit?.status === 'not_required' ? 'Not required for procedural geometry' : 'Embedded inventory unavailable for this format or inspection result'}
      </p><p className="text-muted-foreground">Embedded resources are part of primary geometry, not separate saved attachments. Images in external buffers are excluded from embedded counts.</p></details>
    </div>
    <div className="space-y-1.5 border-t pt-3"><h3 className="font-semibold">Primary geometry dependencies</h3>
      {loading ? <p role="status">Checking dependencies…</p> : error ? <p role="alert">{error}</p>
        : audit?.status === 'missing_primary' ? <p>No inspectable primary geometry is assigned.</p>
        : audit?.status === 'not_supported' || !audit ? <p>Dependency inventory is unavailable.</p>
        : audit.requirements.some(item => !item.satisfied) ? <ul className="space-y-2 text-orange-600 dark:text-orange-400">{audit.requirements.filter(item => !item.satisfied).map(item => <li className="break-words" key={`${item.kind}:${item.relativePath}`}><span className="font-medium">{item.relativePath}</span> · missing {item.kind}<p className="text-muted-foreground">Unresolved reference, not a saved attachment.</p></li>)}</ul>
        : <p className="text-emerald-600 dark:text-emerald-400">No unresolved dependencies reported by inspection.</p>}
    </div>
  </section>;
}
