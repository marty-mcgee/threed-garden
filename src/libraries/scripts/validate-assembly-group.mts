import assert from 'node:assert/strict';
import { Vector3, Matrix4 } from 'three';
// @ts-expect-error Native Node validation needs the explicit extension.
import { parseAssemblyDefinition, parseAssemblyPlacement, serializeAssemblyDefinition, resolveAssemblyComponents, AssemblyContractError } from '../services/threed/models/assembly-group-core.ts';
const transform = (x = 0, y = 0, z = 0, scale = 1) => ({ position: { x, y, z }, rotation: { x: 0, y: 0, z: 0 }, scale });
const definition = () => ({ formatVersion: 1, id: 'assembly-example', ownerId: 'owner-a', name: 'Assembly fixture', revision: 1, components: [
  { id: 'box', modelId: 1, label: 'Box', transform: transform() },
  { id: 'clip-a', modelId: 2, label: 'Clip A', transform: transform(1, 3, 0) },
  { id: 'clip-b', modelId: 2, label: 'Clip B', transform: transform(-1, 3, 0) },
] });
const placement = () => ({ id: 'placement-a', ownerId: 'owner-b', projectId: 7, assemblyId: 'assembly-example', assemblyRevision: 1, transform: transform(10, 2, 20, 2) });
const close = (actual: number[], expected: number[]) => actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `coordinate ${i}`));
let groups = 0;
function group(name: string, run: () => void) { run(); groups++; console.log(`✓ ${name}`); }
group('definition roundtrip retains repeated Models, stable occurrence IDs and elevated transforms', () => {
  const input = definition();
  assert.deepEqual(parseAssemblyDefinition(JSON.parse(serializeAssemblyDefinition(input))), input);
  const copy = parseAssemblyDefinition(input);
  copy.components[1].transform.position.y = 99;
  assert.equal(input.components[1].transform.position.y, 3);
});
group('group rotation and scale preserve relative component positions without grounding', () => {
  const input = definition(); const target = placement(); target.transform.rotation.y = Math.PI / 2;
  const before = JSON.stringify({ input, target });
  const resolved = resolveAssemblyComponents(input, target);
  const positions = resolved.map(row => new Vector3().setFromMatrixPosition(new Matrix4().fromArray(row.worldMatrix)).toArray());
  close(positions[0], [10, 2, 20]); close(positions[1], [10, 8, 18]); close(positions[2], [10, 8, 22]);
  assert.equal(JSON.stringify({ input, target }), before);
  const second = placement(); second.id = 'placement-b'; second.projectId = 8; second.transform = transform(-5, 0, 0);
  close(new Vector3().setFromMatrixPosition(new Matrix4().fromArray(resolveAssemblyComponents(input, second)[1].worldMatrix)).toArray(), [-4, 3, 0]);
  assert.equal(JSON.stringify({ input, target }), before);
});
group('component scale and XYZ rotations compose beneath the placement', () => {
  const input = definition(); input.components[0].transform = transform(0, 4, 0, 3);
  input.components[0].transform.rotation.x = Math.PI / 2;
  const target = placement(); target.transform.rotation.z = Math.PI / 2;
  const world = new Matrix4().fromArray(resolveAssemblyComponents(input, target)[0].worldMatrix);
  close(new Vector3(0, 1, 0).applyMatrix4(world).toArray(), [2, 2, 26]);
});
group('invalid identities, versions, duplicate occurrences and references are rejected', () => {
  for (const change of [{ id: '' }, { ownerId: '' }, { revision: 0 }, { formatVersion: 2 }, { components: [] }, { unexpected: true }]) assert.throws(() => parseAssemblyDefinition({ ...definition(), ...change }), AssemblyContractError);
  const duplicate = definition(); duplicate.components[2].id = 'clip-a'; assert.throws(() => parseAssemblyDefinition(duplicate), AssemblyContractError);
  const badModel = definition(); badModel.components[0].modelId = 1.5; assert.throws(() => parseAssemblyDefinition(badModel), AssemblyContractError);
  assert.throws(() => resolveAssemblyComponents(definition(), { ...placement(), assemblyRevision: 2 }), AssemblyContractError);
  assert.throws(() => resolveAssemblyComponents(definition(), { ...placement(), assemblyId: 'other' }), AssemblyContractError);
  assert.throws(() => parseAssemblyPlacement({ ...placement(), projectId: 0 }), AssemblyContractError);
});
group('non-finite, string, excessive and non-positive transforms reject before composition', () => {
  for (const scale of [0, -1, NaN, Infinity, 10001, '1']) {
    const target = { ...placement(), transform: { ...transform(), scale } };
    assert.throws(() => resolveAssemblyComponents(definition(), target), AssemblyContractError);
  }
  for (const value of [NaN, Infinity, 1_000_001, '2']) {
    assert.throws(() => parseAssemblyPlacement({ ...placement(), transform: { ...transform(), position: { x: value, y: 0, z: 0 } } }), AssemblyContractError);
  }
  const tooMany = definition(); tooMany.components = Array.from({ length: 101 }, (_, i) => ({ ...tooMany.components[0], id: `component-${i}` }));
  assert.throws(() => parseAssemblyDefinition(tooMany), AssemblyContractError);
});
console.log(`PASS: ${groups} assembly contract groups (offline; no assets, database or renderer)`);
