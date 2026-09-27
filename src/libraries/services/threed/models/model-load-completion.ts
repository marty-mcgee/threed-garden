import { LoadingManager, type Object3D, type Mesh, type Texture } from 'three';

/** Geometry completion alone does not imply that its images/buffers loaded. */
export function modelLoadCompletion(manager: LoadingManager, onIssue?: ((url: string, message: string) => void) | null) {
  let pending = false;
  const activeUrls = new Map<string, number>();
  const start = manager.itemStart.bind(manager);
  const end = manager.itemEnd.bind(manager);
  let warningTimer: ReturnType<typeof setTimeout> | undefined;
  if (onIssue) {
    manager.itemStart = url => {
      activeUrls.set(url, (activeUrls.get(url) ?? 0) + 1);
      start(url);
      if (warningTimer === undefined) warningTimer = setTimeout(() => {
        warningTimer = undefined;
        for (const pendingUrl of activeUrls.keys()) onIssue(pendingUrl, 'Taking too long to load');
      }, 30000);
    };
    manager.itemEnd = url => {
      const remaining = (activeUrls.get(url) ?? 1) - 1;
      if (remaining > 0) activeUrls.set(url, remaining); else activeUrls.delete(url);
      end(url);
      if (!failures.has(url)) onIssue(url, '');
    };
  }
  const failures = new Set<string>();
  let notify: (() => void) | undefined;
  manager.onStart = () => { pending = true; };
  manager.onError = url => { failures.add(url); onIssue?.(url, 'Could not load'); notify?.(); };
  manager.onLoad = () => { pending = false; clearTimeout(warningTimer); warningTimer = undefined; notify?.(); };
  return async function waitForResources(timeoutMs = 30000, allowReplacedTextures = false) {
    // Scene rendering is progressive: geometry survives missing or slow textures.
    // Admin export consumers omit onIssue and retain strict readiness checks.
    if (onIssue) return !pending && failures.size === 0;
    if (pending && (allowReplacedTextures || failures.size === 0)) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { notify = undefined; reject(new Error('Model resources timed out')); }, timeoutMs);
        notify = () => {
          if (pending && (allowReplacedTextures || failures.size === 0)) return;
          clearTimeout(timer); notify = undefined; resolve();
        };
      });
    }
    if (failures.size && !allowReplacedTextures) throw new Error('Required Model resources failed to load');
    return failures.size === 0;
  };
}

/** Check the final materials, after saved replacements; failed obsolete maps are not required. */
export function assertModelTexturesReady(root: Object3D) {
  root.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const value of Object.values(material)) {
        const texture = value as Texture | null;
        if (!texture?.isTexture) continue;
        const image = texture.source?.data;
        const images = Array.isArray(image) ? image : [image];
        if (!images.length || images.some(item => !(Number(item?.naturalWidth ?? item?.videoWidth ?? item?.width) > 0)
          || !(Number(item?.naturalHeight ?? item?.videoHeight ?? item?.height) > 0))) {
          throw new Error('A required Model texture is unavailable');
        }
      }
    }
  });
}
