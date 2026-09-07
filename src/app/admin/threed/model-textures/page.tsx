import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ThreeDModelTexturesCRUD } from '@/components/admin/threed/models/ThreeDModelTexturesCRUD';

export default function ModelTexturesPage() {
  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={Images}
        title="ThreeD Model Textures"
        description="Upload and manage reusable master Texture files for ThreeD Model material assignments"
      >
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Back to Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-animations" icon={Clapperboard}>Model Animations</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-files" icon={FolderOpen}>Model Files</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <ThreeDModelTexturesCRUD />
    </div>
  );
}
