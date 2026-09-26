import { Boxes, Package } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

export default function ThreeDAssemblyGroupsPage() {
  return (
    <div className="space-y-4 p-4">
      <AdminWorkspaceHeader
        icon={Boxes}
        title="ThreeD Assembly"
        description="Manage Model assignments for Assembly Groups."
      >
        <div className="ml-auto">
          <AdminWorkspaceLink href="/admin/threed/models" icon={Package}>Models</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <section aria-label="Assembly Groups workspace" className="rounded-lg border border-dashed p-8 text-center">
        <Boxes aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-blue-500" />
        <h2 className="text-sm font-medium">Assembly Model Assignments</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Manage which Models are assigned to Assembly Groups. Composition and construction belong in the Front-End workspace.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Assignment management will follow the approved persistence design.</p>
      </section>
    </div>
  );
}
