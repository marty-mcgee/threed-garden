import { LoadingManager, Texture, TextureLoader, type Group, type Mesh } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// These formats require a decoder; the browser's ImageLoader cannot read them.
// Explicitly registered decoders take precedence. Unknown URLs are left alone.
const unsupportedImage = /\.(?:psd|psb|tiff?|tga|dds|exr|hdr|ktx2?)(?:[?#]|$)/i;
const unsupportedExtensions = ['psd', 'psb', 'tif', 'tiff', 'tga', 'dds', 'exr', 'hdr', 'ktx', 'ktx2'];
const ignoredTextures = new WeakSet<Texture>();

function isUnsupportedImage(url: string) {
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* Retain malformed URLs for ordinary load errors. */ }
  return unsupportedImage.test(decoded.split(/[?#]/, 1)[0].replaceAll('\\', '/'))
    || /^data:image\/(?:vnd\.adobe\.photoshop|tiff|tga|x-tga);/i.test(decoded);
}

/** FBX references to editor-only images are optional, never network requests. */
class OptionalFbxTextureLoader extends TextureLoader {
  override load(...[url, onLoad, onProgress, onError]: Parameters<TextureLoader['load']>): ReturnType<TextureLoader['load']> {
    const requested = this.path + url;
    const resolved = this.manager.resolveURL(requested);
    // An existing attachment alias can replace a PSD reference with a real PNG.
    if (!isUnsupportedImage(resolved) && (
      /\.(?:png|jpe?g|webp|bmp|gif|avif|svg|ico)(?:[?#]|$)/i.test(resolved)
      || /^data:image\/(?:png|jpeg|webp|bmp|gif|avif|svg\+xml);/i.test(resolved)
      || (resolved !== requested && /^https?:/i.test(resolved))
    )) {
      return new TextureLoader(this.manager).setCrossOrigin(this.crossOrigin).load(resolved, onLoad, onProgress, onError);
    }
    const texture = new Texture<HTMLImageElement>();
    ignoredTextures.add(texture);
    if (onLoad) queueMicrotask(() => onLoad(texture));
    return texture;
  }
}

/** Same FBX geometry/rig parser, with unsupported image maps removed before use. */
export class BrowserFBXLoader extends FBXLoader {
  constructor(manager = new LoadingManager()) {
    super(manager);
    for (const extension of unsupportedExtensions) {
      if (manager.getHandler(`.${extension}`) !== null) continue;
      manager.addHandler(new RegExp(`\\.${extension}(?:[?#]|$)`, 'i'), new OptionalFbxTextureLoader(manager));
    }
  }

  override parse(buffer: ArrayBuffer, path: string): Group {
    const root = super.parse(buffer, path);
    const disposed = new Set<Texture>();
    root.traverse(object => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        for (const [key, value] of Object.entries(material)) {
          if (!(value instanceof Texture) || !ignoredTextures.has(value)) continue;
          (material as unknown as Record<string, unknown>)[key] = null;
          material.needsUpdate = true;
          if (!disposed.has(value)) { value.dispose(); disposed.add(value); }
        }
      }
    });
    return root;
  }
}
