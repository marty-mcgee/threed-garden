/** Shared, fetch-free OBJ/MTL dependency and bounded geometry contract. */
export interface ObjRequirement {
  fileName: string;
  kind: 'material' | 'texture';
  relativePath: string;
  referencedBy: string;
}
export const MAX_OBJ_BYTES = 32 * 1024 * 1024;
const unsafeNames = new Set(['__proto__', 'constructor', 'prototype']);
const imageMaps = new Set(['map_kd', 'map_ks', 'map_ke', 'map_d', 'map_bump', 'bump', 'norm', 'disp']);

function lines(text: string): string[] {
  if (!text.trim() || text.includes('\0') || new TextEncoder().encode(text).length > MAX_OBJ_BYTES) throw new Error('OBJ/MTL text is empty, invalid or exceeds 32 MiB.');
  return text.replace(/^\uFEFF/, '').replace(/\\\r?\n/g, ' ').split(/\r?\n/).map((line) => {
    if (line.length > 65_536) throw new Error('OBJ/MTL line exceeds the supported limit.');
    let quote = '';
    for (let i = 0; i < line.length; i += 1) {
      if (quote && line[i] === quote) quote = '';
      else if (!quote && (line[i] === '"' || line[i] === "'")) quote = line[i];
      else if (!quote && line[i] === '#') return line.slice(0, i).trim();
    }
    if (quote) throw new Error('Unclosed quote in OBJ/MTL text.');
    return line.trim();
  }).filter(Boolean);
}
function tokens(text: string) { return [...text.matchAll(/"([^"]*)"|'([^']*)'|([^\s]+)/g)].map((match) => match[1] ?? match[2] ?? match[3]); }
function name(value: string) {
  if (!value || value.length > 255 || unsafeNames.has(value)) throw new Error('Invalid OBJ/MTL material name.');
  return value;
}
export function resolveObjPath(reference: string, parent = ''): string {
  if (/[\0?#]/.test(reference) || /^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(reference)) throw new Error(`Use a local relative OBJ/MTL file path: ${reference.slice(0, 120)}.`);
  let decoded: string;
  try { decoded = decodeURIComponent(reference.replaceAll('\\', '/')).replaceAll('\\', '/'); } catch { throw new Error('Invalid OBJ/MTL path encoding.'); }
  if (/%|[\0?#]|^[\/]|^[a-z][a-z\d+.-]*:/i.test(decoded)) throw new Error('Unsupported OBJ/MTL path encoding.');
  const parts = parent.split('/').slice(0, -1);
  for (const part of decoded.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!parts.length) throw new Error('OBJ/MTL dependency escapes its Model bundle.'); parts.pop(); }
    else parts.push(part);
  }
  const result = parts.join('/');
  if (!result || result.length > 356 || parts.at(-1)!.length > 255 || parts.slice(0, -1).join('/').length > 100) throw new Error('OBJ/MTL dependency path exceeds the attachment limits.');
  return result;
}
function requirement(path: string, kind: ObjRequirement['kind'], parent: string): ObjRequirement {
  return { fileName: path.split('/').at(-1)!, kind, relativePath: path, referencedBy: parent };
}
export function inspectObjLibraries(text: string, fileName: string): ObjRequirement[] {
  const found = new Map<string, ObjRequirement>();
  for (const line of lines(text)) {
    const match = /^mtllib\s+(.+)$/i.exec(line);
    if (!match) continue;
    const parts = tokens(match[1]);
    // A single unquoted filename can contain spaces; several .mtl names are separate libraries.
    const refs = parts.every((part) => /\.mtl$/i.test(part)) ? parts : [parts.join(' ')];
    for (const ref of refs) {
      const path = resolveObjPath(ref);
      if (!/\.mtl$/i.test(path)) throw new Error('OBJ material libraries must be .mtl files.');
      found.set(path.toLowerCase(), requirement(path, 'material', fileName));
      if (found.size > 500) throw new Error('OBJ references more than 500 material libraries.');
    }
  }
  return [...found.values()];
}
export function inspectObjGeometry(text: string, fileName: string) {
  const source = lines(text);
  const counts = [0, 0, 0];
  let expanded = 0;
  let groups = 0;
  const usedMaterials = new Set<string>();
  const normalized: string[] = [];
  for (const line of source) {
    const [command, ...args] = tokens(line);
    if (['v', 'vt', 'vn'].includes(command)) {
      const index = ['v', 'vt', 'vn'].indexOf(command);
      const min = command === 'vt' ? 2 : 3;
      if (args.length < min || args.some((value) => !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1e15)) throw new Error('OBJ contains invalid vertex, normal or UV values.');
      counts[index] += 1;
    } else if (command === 'f' || command === 'l' || command === 'p') {
      if (args.length < (command === 'f' ? 3 : command === 'l' ? 2 : 1)) throw new Error('OBJ contains an incomplete primitive.');
      for (const vertex of args) {
        const indices = vertex.split('/');
        if (indices.length > 3) throw new Error('Invalid OBJ primitive indices.');
        indices.forEach((value, index) => {
          if (!value && index > 0) return;
          const n = Number(value);
          if (!Number.isSafeInteger(n) || n === 0 || (n > 0 ? n > counts[index] : -n > counts[index])) throw new Error('OBJ primitive index is outside its declared geometry.');
        });
      }
      expanded += command === 'f' ? (args.length - 2) * 3 : args.length;
      if (expanded * 48 > MAX_OBJ_BYTES) throw new Error('Decoded OBJ geometry exceeds 32 MiB.');
    } else if (command === 'o' || command === 'g') {
      groups += 1;
      if (groups > 4096) throw new Error('OBJ exceeds 4096 object/group declarations.');
    } else if (command === 'usemtl') usedMaterials.add(name(args.join(' ')));
    else if (!['mtllib', 'o', 'g', 's'].includes(command)) throw new Error(`Unsupported OBJ directive: ${command.slice(0, 60)}.`);
    if (usedMaterials.size > 500) throw new Error('OBJ uses more than 500 material names.');
    normalized.push(command === 'usemtl' ? `usemtl ${args.join(' ')}` : line);
  }
  if (!counts[0] || !expanded) throw new Error('OBJ has no renderable geometry.');
  return { requirements: inspectObjLibraries(text, fileName), usedMaterials: [...usedMaterials], text: normalized.join('\n') };
}

export function inspectObjMaterial(text: string, materialPath: string) {
  const requirements: ObjRequirement[] = [];
  const maps: Array<{ property: string; path: string; clamp: boolean; material: string }> = [];
  const names = new Set<string>();
  const output: string[] = [];
  let current = '';
  for (const line of lines(text)) {
    const [raw, ...args] = tokens(line);
    const key = raw.toLowerCase();
    if (key === 'newmtl') {
      current = name(args.join(' '));
      if (names.has(current) || names.size >= 500) throw new Error('Duplicate or excessive MTL material definitions.');
      names.add(current);
      output.push(`newmtl ${current}`);
      continue;
    }
    if (!current) throw new Error('MTL properties require a preceding newmtl definition.');
    if (imageMaps.has(key)) {
      const options: string[] = [];
      let clamp = false;
      while (args[0]?.startsWith('-')) {
        const option = args.shift()!;
        if (option === '-clamp') {
          const value = args.shift();
          if (!['on', 'off'].includes(value ?? '')) throw new Error('MTL -clamp requires on or off.');
          clamp = value === 'on';
        } else if (option === '-s' || option === '-o') {
          const values: string[] = [];
          while (values.length < 3 && args.length && Number.isFinite(Number(args[0]))) values.push(args.shift()!);
          if (!values.length) throw new Error(`MTL ${option} requires numeric values.`);
          while (values.length < 3) values.push(option === '-s' ? '1' : '0');
          options.push(option, ...values);
        } else if (option === '-bm' || option === '-mm') {
          const values = args.splice(0, option === '-mm' ? 2 : 1);
          if (values.length !== (option === '-mm' ? 2 : 1) || values.some((v) => !Number.isFinite(Number(v)))) throw new Error(`Invalid MTL ${option} values.`);
          options.push(option, ...values);
        } else throw new Error(`Unsupported MTL texture option: ${option}.`);
      }
      const path = resolveObjPath(args.join(' '), materialPath);
      if (!/\.(?:png|jpe?g|webp|bmp)$/i.test(path)) throw new Error('OBJ textures support PNG, JPEG, WebP and BMP.');
      requirements.push(requirement(path, 'texture', materialPath));
      maps.push({ property: key, path, clamp, material: current });
      // Unique per-map URI keeps options and texture ownership independent.
      output.push(`${key} ${[...options, `obj-map:${maps.length - 1}`].join(' ')}`);
      if (maps.length > 500) throw new Error('MTL references more than 500 texture maps.');
    } else {
      if (/^(?:map_|refl$|decal$)/.test(key)) throw new Error(`Unsupported MTL map: ${key}.`);
      if (['ka', 'kd', 'ks', 'ke', 'tf'].includes(key) && (args.length !== 3 || args.some((v) => !Number.isFinite(Number(v))))) throw new Error('MTL color requires three finite values.');
      if (['ns', 'ni', 'd', 'tr', 'illum'].includes(key) && (args.length !== 1 || !Number.isFinite(Number(args[0])))) throw new Error('Invalid numeric MTL property.');
      output.push(`${key} ${args.join(' ')}`);
    }
  }
  if (!names.size) throw new Error('MTL has no material definitions.');
  return { requirements, maps, names: [...names], text: output.join('\n') };
}
