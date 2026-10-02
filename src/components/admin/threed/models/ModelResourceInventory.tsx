import Link from 'next/link';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';

export interface ModelResourceAudit {
  status: 'analyzed' | 'missing_primary' | 'not_required' | 'not_supported';
  requirements: Array<{ kind: string; relativePath: string; satisfied: boolean; matchedFileId?: number | null; referencedBy?: string }>;
  embeddedResources?: { status: 'inspected' | 'not_inspected'; buffers: number; images: number };
}

export function ModelResourceInventory({ model, audit, loading, error, textureLibrary = [] }: {
  model: ModelData & { mainModelFileId: number | null };
  audit: ModelResourceAudit | null;
  loading: boolean;
  error: string | null;
  textureLibrary?: Array<{ id: number; filePath: string; textureName: string }>;
}) {
  const primary = model.files?.find(file => file.id === model.mainModelFileId && file.fileType === 'model');
  const supporting = model.files?.filter(file => file !== primary) ?? [];
  const assignments = model.materialAssignments ?? [];
  const linked = textureLibrary.filter(texture => assignments.some(assignment => assignment.textureId === texture.id)
    || model.files?.some(file => file.fileType === 'texture' && file.filePath === texture.filePath));
  const otherAssignments = assignments.filter(assignment => !linked.some(texture => texture.id === assignment.textureId));
  const embedded = audit?.embeddedResources;
  const fileLink = (file: NonNullable<ModelData['files']>[number]) => <Link className="break-all underline" href={`/admin/threed/models/${model.id}/files/${file.id}`}>{file.fileName} · #{file.id}</Link>;
  return <section aria-label="Model resource inventory" className="space-y-3 rounded-lg border p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Resource inventory</h2>
      <Link className="underline" href={`/admin/threed/models/${model.id}/files/new`}>Add File</Link></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><h3 className="font-medium">Primary geometry</h3>{primary ? fileLink(primary)
        : <p className="text-muted-foreground">{model.modelType === 'procedural' && model.mainModelFileId === null ? 'Procedural shape · no primary File required' : 'No valid saved primary File'}</p>}</div>
      <div><h3 className="font-medium">Supporting attachments ({supporting.length})</h3>
        {supporting.length ? <ul className="space-y-1">{supporting.map(file => <li key={file.id}>{fileLink(file)} <span className="text-muted-foreground">· {file.fileType}{file.fileType === 'model' ? ' · alternate geometry' : ''}</span></li>)}</ul> : <p className="text-muted-foreground">No saved supporting attachments</p>}</div>
      <div><h3 className="font-medium">Linked Texture records</h3>
        {linked.length || otherAssignments.length ? <ul className="space-y-1">
          {linked.map(texture => <li key={texture.id}>{texture.textureName} · Texture #{texture.id}{assignments.some(assignment => assignment.textureId === texture.id) ? ' · material assignment' : ' · shared attachment URL'}</li>)}
          {otherAssignments.map(assignment => <li key={`${assignment.targetKey}:${assignment.channel}`}>{assignment.textureName} · Texture #{assignment.textureId} · {assignment.targetKey}</li>)}
        </ul> : <p className="text-muted-foreground">No linked records identified</p>}
        <p className="text-xs text-muted-foreground">Library filename suggestions are not saved links.</p></div>
      <div><h3 className="font-medium">Embedded resources</h3><p className="text-muted-foreground">
        {loading ? 'Inspecting saved geometry…' : embedded?.status === 'inspected'
          ? `${embedded.buffers} embedded buffer(s) · ${embedded.images} embedded image(s), declared inside the geometry File`
          : audit?.status === 'not_required' ? 'Not required for procedural geometry' : 'Embedded inventory unavailable for this format or inspection result'}
      </p><p className="text-xs text-muted-foreground">Embedded resources are part of geometry, not separate saved attachments. Images in external buffers are excluded from embedded counts.</p></div>
    </div>
    <div className="border-t pt-2"><h3 className="font-medium">Missing dependencies</h3>
      {loading ? <p role="status">Checking dependencies…</p> : error ? <p role="alert">{error}</p>
        : audit?.status === 'missing_primary' ? <p>No inspectable primary geometry is assigned.</p>
        : audit?.status === 'not_supported' || !audit ? <p>Dependency inventory is unavailable.</p>
        : audit.requirements.some(item => !item.satisfied) ? <ul className="space-y-1">{audit.requirements.filter(item => !item.satisfied).map(item => <li className="break-all" key={`${item.kind}:${item.relativePath}`}>{item.relativePath} · missing {item.kind} · unresolved reference, not a saved attachment</li>)}</ul>
        : <p className="text-muted-foreground">No unresolved dependencies reported by inspection.</p>}
    </div>
  </section>;
}
