// Read-only rest-pose measurement. Textures are unnecessary for geometry bounds.
// node src/libraries/scripts/measure-character-height.mjs <local.fbx> <combined-catalog-scale> <metres-per-scene-unit> [target-metres]
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Box3, Texture, TextureLoader, Vector3 } from 'three';
import { assetSizeReport } from './asset-size-report.mjs';

const [file, scaleText, unitText, targetText, ...extra] = process.argv.slice(2);
const scale = Number(scaleText);
const unit = Number(unitText);
const target = targetText === undefined ? undefined : Number(targetText);
if (!file || extra.length) throw new Error('Usage: measure-character-height.mjs <local.fbx> <combined-catalog-scale> <metres-per-scene-unit> [target-metres]');
// Validate explicit configuration before reading a file. No Character-specific defaults.
assetSizeReport(1, scale, unit, target);
const bytes = await readFile(file);
const originalLoad = TextureLoader.prototype.load;
TextureLoader.prototype.load = function () { return new Texture(); };
try {
  const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  model.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(model, true);
  const height = bounds.getSize(new Vector3()).y;
  if (!Number.isFinite(height) || height <= 0) throw new Error('Model has no measurable height.');
  console.log(JSON.stringify({
    sha256: createHash('sha256').update(bytes).digest('hex'),
    measurement: 'Loaded rest-pose world-space Y bounds; excludes current Project instance multiplier.',
    minY: bounds.min.y, maxY: bounds.max.y,
    ...assetSizeReport(height, scale, unit, target),
    note: 'Physical height uses the supplied Project calibration. Bounds do not establish source units. Proposed sizing is not applied and does not resize the physics capsule.',
  }, null, 2));
} finally { TextureLoader.prototype.load = originalLoad; }
