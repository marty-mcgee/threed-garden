import { Mesh, SkinnedMesh, Texture, type BufferGeometry, type Material, type Object3D, type Skeleton } from 'three';

export function modelMaterials(root: Object3D): Set<Material> {
  const materials = new Set<Material>();
  root.traverse(object => {
    if (object instanceof Mesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  return materials;
}

/** Own a fresh loader result only. Never use this for cached clones or Scene assets. */
export function ownTransientModelResources(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = modelMaterials(root);
  const textures = new Set<Texture>();
  const skeletons = new Set<Skeleton>();
  let disposed = false;
  root.traverse(object => {
    if (object instanceof Mesh) geometries.add(object.geometry);
    if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value);
    }
  }
  return {
    /** Lighting creates material clones. Assignment textures retain their separate owner. */
    retainNewMaterials(previous: ReadonlySet<Material>) {
      for (const material of modelMaterials(root)) {
        if (!previous.has(material)) materials.add(material);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const skeleton of skeletons) {
        if (skeleton.boneTexture) textures.delete(skeleton.boneTexture);
        skeleton.dispose();
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      // Dispose texture GPU allocations. Decoded images may be shared by browser
      // loaders, so do not close ImageBitmaps or mutate image sources here.
      for (const texture of textures) texture.dispose();
      geometries.clear();
      materials.clear();
      textures.clear();
      skeletons.clear();
    },
  };
}
