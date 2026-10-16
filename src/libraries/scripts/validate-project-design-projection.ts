import assert from 'node:assert/strict';
import { newDesign } from '../services/threed/design/document';
import { projectDesignCreateKey, saveProjectDesignProjection } from '../services/threed/design/project-design-projection';

async function main() {
  const document = newDesign();
  const config = { unrelated: { retained: true }, threeDArchitecture: { version: 1, document } };
  let owned = true;
  let fail = false;
  let row: any;
  const tx = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => ({ for: async () => owned ? [{ config }] : [] }) }) }) }),
    insert: () => ({ values: (values: any) => ({ onConflictDoUpdate: () => ({ returning: async () => {
      if (fail) throw new Error('mock database failure');
      row = { ...values, id: row?.id ?? 1 };
      return [row];
    } }) }) }),
  } as unknown as Parameters<typeof saveProjectDesignProjection>[0];
  assert.equal(await saveProjectDesignProjection(tx, 'owner', 17), 1);
  const key = row.createKey;
  document.name = 'Updated room';
  assert.equal(await saveProjectDesignProjection(tx, 'owner', 17), 1);
  assert.equal(row.createKey, key);
  assert.equal(row.document.name, 'Updated room');
  assert.deepEqual(config.unrelated, { retained: true });
  document.version = 6;
  document.nodes = [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 4, z: 0 }];
  document.walls = [{ id: 'sloped', levelId: document.levels[0].id, start: 'a', end: 'b', height: 2, endHeight: 4, thickness: .2, elevation: 0 }];
  assert.equal(await saveProjectDesignProjection(tx, 'owner', 17), 1);
  assert.equal(row.formatVersion, 6);
  assert.deepEqual(row.document, document, 'Complete editable v6 parameters survive the mocked projection boundary.');
  assert.notEqual(key, projectDesignCreateKey('other-owner', 17));
  assert.notEqual(key, projectDesignCreateKey('owner', 18));
  owned = false;
  await assert.rejects(saveProjectDesignProjection(tx, 'owner', 17), /not owned/);
  owned = true;
  fail = true;
  await assert.rejects(saveProjectDesignProjection(tx, 'owner', 17), /mock database failure/);
  fail = false;
  const previous = config.threeDArchitecture;
  delete (config as Partial<typeof config>).threeDArchitecture;
  assert.equal(await saveProjectDesignProjection(tx, 'owner', 17), undefined);
  config.threeDArchitecture = previous;
  console.log('PASS: projection creation/update, stable identity, owner rejection, failure propagation, absent architecture and unrelated config. Mocked DB only.');
}
void main();
