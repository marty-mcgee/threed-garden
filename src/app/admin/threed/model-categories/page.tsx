import { ArrowLeft, Clapperboard, FolderOpen, FolderTree } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ThreeDModelCategoriesManager } from '@/components/admin/threed/models/ThreeDModelCategoriesManager';

export default function ModelCategoriesPage() {
  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={FolderTree}
        title="Model Categories"
        description="Organize reusable Models with owner-scoped relational taxonomy"
      >
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Back to Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-animations" icon={Clapperboard}>Model Animations</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-files" icon={FolderOpen}>Model Files</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <ThreeDModelCategoriesManager />
    </div>
  );
}
