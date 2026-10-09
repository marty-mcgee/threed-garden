import { DataTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, NoColorSpace, RepeatWrapping, RGBAFormat, SRGBColorSpace, UnsignedByteType } from 'three';
import type { CottageParameters, MaterialRecipe, TextureArtifact } from './types';

type Surface = 'roof' | 'stone' | 'siding' | 'wood' | 'paving' | 'oak_floor';
export interface CottageMaterialSet { recipes: MaterialRecipe[]; textures: TextureArtifact[]; byId: Record<string, MeshStandardMaterial>; dispose(): void }

/** Fixed 32-bit RNG; intentionally independent of the Python/NumPy reference generator. */
export function cottageRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let n = Math.imul(state ^ state >>> 15, state | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const byte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const modulo = (n: number, size: number) => ((n % size) + size) % size;
function surfaceSeed(seed: number, kind: string) { for (const c of kind) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619); return seed >>> 0; }

function pixels(kind: Surface, size: number, seed: number, weather: number): { color: Uint8Array; height: Float32Array } {
  const random = cottageRandom(surfaceSeed(seed, kind));
  const color = new Uint8Array(size * size * 4), height = new Float32Array(size * size);
  const tiles = Array.from({ length: 17 * 17 }, () => random());
  const palette = [[138,143,139],[157,152,132],[113,129,138],[177,169,146],[148,151,145],[135,147,151]];
  const sites = Array.from({ length: 90 }, () => ({ x: random() * size, y: random() * size, color: palette[Math.floor(random() * palette.length)] }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x * 512 / size, py = y * 512 / size, noise = (random() - .5) * 8;
    let rgb: number[], h = 180;
    if (kind === 'roof') {
      const row = Math.floor(py / 32), col = Math.floor((px + row % 2 * 16) / 32), tone = tiles[row * 17 + col];
      const seam = py % 32 < 2 || (px + row % 2 * 16) % 32 < 2;
      const grain = Math.sin(px * .7 + py * .04) * 2 + noise;
      const patina = weather * Math.sin(px * .018 + Math.sin(py * .013)) * Math.sin(py * .031) * 7;
      rgb = seam ? [48,52,57] : [92 + tone * 24 + grain + patina, 98 + tone * 19 + grain + patina, 107 + tone * 12 + grain + patina];
      h = seam ? 30 : 175 + tone * 20 + noise;
    } else if (kind === 'stone') {
      let best = Infinity, second = Infinity, nearest = sites[0];
      const warp = Math.sin(x / size * Math.PI * 6) * size / 80 + Math.sin(y / size * Math.PI * 4) * size / 100;
      for (const site of sites) {
        const dx = Math.abs(modulo(x + warp - site.x + size / 2, size) - size / 2);
        const dy = Math.abs(modulo(y - warp - site.y + size / 2, size) - size / 2), distance = dx * dx + dy * dy;
        if (distance < best) { second = best; best = distance; nearest = site; } else if (distance < second) second = distance;
      }
      const gap = (Math.sqrt(second) - Math.sqrt(best)) * 512 / size, mortar = gap < 1.5;
      const shade = .90 + .1 * Math.min(1, gap / 5), mineral = 3 * Math.sin(px * .16 + Math.sin(py * .12) * 3);
      rgb = mortar ? [185,182,162] : nearest.color.map(v => v * shade + noise + mineral);
      h = mortar ? 45 : Math.min(230, 130 + gap * 10 + noise);
    } else if (kind === 'siding') {
      const variation = tiles[Math.floor(py / 32)] * 10 - 5, grain = Math.sin(px * .11 + py * .25) * 1.5 + noise * .4;
      const seam = py % 32 < 2; rgb = seam ? [42,61,50] : [69 + variation + grain, 94 + variation + grain, 81 + variation + grain]; h = seam ? 70 : 190;
    } else if (kind === 'wood' || kind === 'oak_floor') {
      const grain = 4 * Math.sin(px * .14 + Math.sin(py * .04) * 1.5) + 2 * Math.sin(px * .5 + py * .012) + noise * .5;
      const seam = kind === 'oak_floor' && (py % 32 < 2 || (px + Math.floor(py / 32) % 3 * 64) % 192 < 2);
      rgb = seam ? [100,81,58] : kind === 'wood' ? [102 + grain,68 + grain * .7,43 + grain * .4] : [155 + grain,125 + grain * .7,88 + grain * .4];
      h = seam ? 70 : 180 + grain * 3;
    } else {
      const seam = px % 128 < 3 || py % 128 < 3; rgb = seam ? [101,110,108] : [147 + noise,155 + noise,158 + noise]; h = seam ? 65 : 180;
    }
    const i = y * size + x; color.set([byte(rgb[0]), byte(rgb[1]), byte(rgb[2]), 255], i * 4); height[i] = h / 255;
  }
  return { color, height };
}

export function createCottageMaterials(p: CottageParameters): CottageMaterialSet {
  const recipes: MaterialRecipe[] = [], textures: TextureArtifact[] = [], byId: Record<string, MeshStandardMaterial> = {};
  function artifact(surface: Surface, role: TextureArtifact['role'], data: Uint8Array) {
    const id = `${surface}_${role}`, texture = new DataTexture(data, p.texture_resolution, p.texture_resolution, RGBAFormat, UnsignedByteType);
    texture.name = id; texture.colorSpace = role === 'baseColor' ? SRGBColorSpace : NoColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping; texture.flipY = false; texture.channel = 0;
    texture.magFilter = LinearFilter; texture.minFilter = LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
    textures.push({ id, name: id, relativePath: `textures/${id}.png`, role, width: p.texture_resolution, height: p.texture_resolution,
      pixels: data, texture, colorSpace: role === 'baseColor' ? 'srgb' : 'linear', mimeType: 'image/png' });
    return texture;
  }
  const maps = new Map<Surface, { map: DataTexture; normalMap: DataTexture; ormMap: DataTexture }>();
  function surfaceMaps(kind: Surface, roughness: number) {
    const existing = maps.get(kind); if (existing) return existing;
    const size = p.texture_resolution, source = pixels(kind, size, p.seed, p.texture_weathering);
    const normal = new Uint8Array(size * size * 4), orm = new Uint8Array(normal.length);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x, h = source.height[i];
      const dx = (source.height[y * size + modulo(x + 1, size)] - source.height[y * size + modulo(x - 1, size)]) * 2.5;
      const dy = (source.height[modulo(y + 1, size) * size + x] - source.height[modulo(y - 1, size) * size + x]) * 2.5;
      const length = Math.hypot(dx, dy, 1);
      normal.set([byte((.5 - dx / length * .5) * 255), byte((.5 - dy / length * .5) * 255), byte((.5 + .5 / length) * 255), 255], i * 4);
      // glTF ORM: R = occlusion, G = roughness, B = metallic. One image serves all three roles.
      orm.set([byte((.62 + .38 * h) * 255), byte((roughness + (1 - h) * .13) * 255), 0, 255], i * 4);
    }
    const result = { map: artifact(kind, 'baseColor', source.color), normalMap: artifact(kind, 'normal', normal), ormMap: artifact(kind, 'packedORM', orm) };
    maps.set(kind, result); return result;
  }
  function add(id: string, color: [number, number, number], roughness: number, surface?: Surface, opacity = 1) {
    const material = new MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0, vertexColors: true, transparent: opacity < 1, opacity });
    material.color.setRGB(...color); material.name = id;
    material.userData = { builderMaterialId: id };
    const textureBindings: MaterialRecipe['textureBindings'] = {};
    if (surface) {
      const m = surfaceMaps(surface, roughness);
      material.map = m.map; material.normalMap = m.normalMap; material.aoMap = material.roughnessMap = material.metalnessMap = m.ormMap;
      // Three's derivative tangent basis uses the opposite Y sign from glTF without explicit tangents.
      // Match GLTFLoader's tangentless convention so exporter and reusable images retain identical bytes.
      material.normalScale.set(.7, -.7); material.aoMapIntensity = .65; material.roughness = material.metalness = 1;
      Object.assign(textureBindings, { baseColor: `${surface}_baseColor`, normal: `${surface}_normal`, occlusion: `${surface}_packedORM`, roughness: `${surface}_packedORM`, metallic: `${surface}_packedORM` });
    }
    if (opacity < 1) { material.side = DoubleSide; material.depthWrite = false; }
    recipes.push({ id, name: id, material, textureBindings, baseColor: color, roughness: material.roughness, metalness: material.metalness,
      opacity, doubleSided: opacity < 1, normalScale: [material.normalScale.x, material.normalScale.y], aoStrength: material.aoMapIntensity });
    byId[id] = material;
  }
  add('weathered_slate_roof', [1,1,1], .64, 'roof'); add('irregular_fieldstone', [1,1,1], .9, 'stone');
  add('sage_horizontal_siding', [1,1,1], .85, 'siding'); add('stained_timber', [1,1,1], .67, 'wood');
  add('dark_structural_timber', [.065,.09,.08], .85); add('clear_tinted_glass', [.82,.93,.98], .10, undefined, p.glass_opacity);
  add('jointed_concrete_paving', [1,1,1], .48, 'paving'); add('porch_deck', [1,1,.96], .56, 'wood');
  if (p.interior_enabled) { add('warm_interior_plaster', [.88,.87,.81], .92); add('interior_oak_floor', [1,1,1], .68, 'oak_floor'); add('wing_interior_tile', [.91,.91,.88], .72, 'paving'); }
  let disposed = false;
  return { recipes, textures, byId, dispose() { if (disposed) return; disposed = true; recipes.forEach(r => r.material.dispose()); textures.forEach(t => t.texture.dispose()); } };
}
