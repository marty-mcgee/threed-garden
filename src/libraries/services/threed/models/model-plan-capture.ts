import {
  AmbientLight,
  Color,
  DirectionalLight,
  OrthographicCamera,
  Scene,
  SkinnedMesh,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Object3D,
  type WebGLRenderer,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { measureModelLocalBounds } from './model-local-bounds';

export interface ModelPlanCapture {
  url: string;
  bounds: {
    center: [number, number, number];
    halfExtents: [number, number, number];
  };
}

/** One read-only image, using the existing renderer and already-loaded resources. */
export function captureModelPlanImage(renderer: WebGLRenderer, root: Object3D, body: Object3D): ModelPlanCapture | null {
  if (renderer.getContext().isContextLost()) return null;
  const box = measureModelLocalBounds(root, body);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  if (box.isEmpty() || ![...size, ...center].every(Number.isFinite)) return null;
  const width = Math.max(size.x, .0001);
  const depth = Math.max(size.z, .0001);
  const pixelWidth = Math.max(1, Math.round(512 * width / Math.max(width, depth)));
  const pixelHeight = Math.max(1, Math.round(512 * depth / Math.max(width, depth)));
  const target = new WebGLRenderTarget(pixelWidth, pixelHeight, {
    generateMipmaps: false,
  });
  target.texture.colorSpace = renderer.outputColorSpace;
  const scene = new Scene();
  const snapshot = clone(root);
  snapshot.matrixAutoUpdate = false;
  snapshot.matrix.copy(body.matrixWorld).invert().multiply(root.matrixWorld);
  scene.add(snapshot);
  scene.add(new AmbientLight(0xffffff, 2));
  const light = new DirectionalLight(0xffffff, 3);
  light.position.set(center.x + width, box.max.y + Math.max(width, depth, 1), center.z - depth);
  light.target.position.copy(center);
  scene.add(light, light.target);
  const distance = Math.max(width, depth, size.y, 1) * 2;
  const camera = new OrthographicCamera(-width / 2, width / 2, depth / 2, -depth / 2, .01, distance * 2 + size.y);
  camera.up.set(0, 0, -1);
  camera.position.set(center.x, box.max.y + distance, center.z);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  const previous = {
    target: renderer.getRenderTarget(),
    cubeFace: renderer.getActiveCubeFace(),
    mipLevel: renderer.getActiveMipmapLevel(),
    viewport: renderer.getViewport(new Vector4()),
    scissor: renderer.getScissor(new Vector4()),
    scissorTest: renderer.getScissorTest(),
    clearColor: renderer.getClearColor(new Color()),
    clearAlpha: renderer.getClearAlpha(),
    autoClear: renderer.autoClear,
    xr: renderer.xr.enabled,
    shadowAutoUpdate: renderer.shadowMap.autoUpdate,
  };
  try {
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.autoClear = true;
    renderer.setRenderTarget(target);
    renderer.setViewport(0, 0, pixelWidth, pixelHeight);
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
    const pixels = new Uint8Array(pixelWidth * pixelHeight * 4);
    renderer.readRenderTargetPixels(target, 0, 0, pixelWidth, pixelHeight, pixels);
    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const image = context.createImageData(pixelWidth, pixelHeight);
    const stride = pixelWidth * 4;
    for (let y = 0; y < pixelHeight; y++) {
      image.data.set(pixels.subarray((pixelHeight - 1 - y) * stride, (pixelHeight - y) * stride), y * stride);
    }
    context.putImageData(image, 0, 0);
    return {
      url: canvas.toDataURL('image/png'),
      bounds: {
        center: center.toArray(),
        halfExtents: [Math.max(size.x / 2, .00005), Math.max(size.y / 2, .00005), Math.max(size.z / 2, .00005)],
      },
    };
  } finally {
    renderer.setRenderTarget(previous.target, previous.cubeFace, previous.mipLevel);
    renderer.setViewport(previous.viewport);
    renderer.setScissor(previous.scissor);
    renderer.setScissorTest(previous.scissorTest);
    renderer.setClearColor(previous.clearColor, previous.clearAlpha);
    renderer.autoClear = previous.autoClear;
    renderer.xr.enabled = previous.xr;
    renderer.shadowMap.autoUpdate = previous.shadowAutoUpdate;
    target.dispose();
    // Geometry, materials and textures belong to the loaded Model. Only cloned
    // skeleton textures and the temporary render target are capture-owned.
    snapshot.traverse(object => {
      if (object instanceof SkinnedMesh) object.skeleton.dispose();
    });
    scene.clear();
  }
}

interface CaptureJob {
  root: Object3D;
  body: Object3D;
  done: (image: ModelPlanCapture | null) => void;
}
interface CaptureQueue {
  jobs: Set<CaptureJob>;
  frame: number | null;
}
const queues = new WeakMap<WebGLRenderer, CaptureQueue>();

/** Bound GPU readback to one Model per animation frame; cancellation releases queued references. */
export function queueModelPlanCapture(renderer: WebGLRenderer, root: Object3D, body: Object3D, done: CaptureJob['done']): () => void {
  let queue = queues.get(renderer);
  if (!queue) {
    queue = {
      jobs: new Set(),
      frame: null,
    };
    queues.set(renderer, queue);
  }
  const current = queue;
  const job = {
    root,
    body,
    done,
  };
  current.jobs.add(job);
  const schedule = () => {
    if (current.frame !== null || !current.jobs.size) return;
    current.frame = requestAnimationFrame(() => {
      current.frame = null;
      const next = current.jobs.values().next().value;
      if (!next) return;
      current.jobs.delete(next);
      let image: ModelPlanCapture | null = null;
      try {
        if (next.root.parent === next.body) image = captureModelPlanImage(renderer, next.root, next.body);
      } catch {
        // Keep the selectable bounds fallback; never retry a failed renderer.
      }
      next.done(image);
      schedule();
    });
  };
  schedule();
  return () => {
    current.jobs.delete(job);
    if (!current.jobs.size && current.frame !== null) {
      cancelAnimationFrame(current.frame);
      current.frame = null;
    }
  };
}
