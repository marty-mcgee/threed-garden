import { distance, entityLevelId, formatLength, roofProfile, type DesignDocument } from './document';
import { entityPoints } from './object-properties';

/** A derived inventory only: IDs are the editable document's IDs, never Model IDs. */
export function architectureAssets(doc: DesignDocument, search = '', units: 'imperial' | 'metric' = 'imperial') {
  const length = (metres: number) => units === 'metric' ? `${Number(metres.toFixed(3))} m` : formatLength(metres);
  const query = search.trim().toLocaleLowerCase();
  return [...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings].map(entity => {
    const wall = doc.walls.find(item => item.id === entity.id);
    const floor = doc.floors.find(item => item.id === entity.id);
    const roof = doc.roofs.find(item => item.id === entity.id);
    const opening = doc.openings.find(item => item.id === entity.id);
    const type = wall ? 'Wall' : floor ? 'Floor' : roof ? 'Roof' : opening ? (opening.kind === 'door' ? 'Door' : 'Window') : 'kind' in entity && entity.kind === 'skylight' ? 'Skylight' : 'Roof Cutout';
    const levelId = entityLevelId(doc, entity.id)!;
    const level = doc.levels.find(item => item.id === levelId)!;
    const points = entityPoints(doc, entity.id);
    const x = (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2;
    const z = (Math.min(...points.map(p => p.z)) + Math.max(...points.map(p => p.z))) / 2;
    const hostWall = opening ? doc.walls.find(item => item.id === opening.wallId) : undefined;
    const hostRoof = roof ?? ('roofId' in entity ? doc.roofs.find(item => item.id === entity.roofId) : undefined);
    const y = level.elevation + (wall ? wall.elevation + wall.height / 2 : floor ? floor.elevation : opening && hostWall ? hostWall.elevation + opening.sill + opening.height / 2 : hostRoof ? hostRoof.elevation + roofProfile(entityPoints(doc, hostRoof.id), hostRoof).height({ x, z }) : 0);
    const dimensions = wall ? `${length(distance(points[0], points[1]))} long / ${length(wall.height)} high`
      : opening ? `${length(opening.width)} wide / ${length(opening.height)} high`
      : 'length' in entity ? `${length(entity.width)} / ${length(entity.length)}`
      : `${length(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)))} / ${length(Math.max(...points.map(p => p.z)) - Math.min(...points.map(p => p.z)))}`;
    const label = `${type} ${entity.id}`;
    return { id: entity.id, type, label, levelId, levelName: level.name, dimensions, position: { x, y, z } };
  }).filter(item => !query || `Architecture ${item.label} ${item.levelName} ${item.dimensions}`.toLocaleLowerCase().includes(query));
}

export type ArchitectureAsset = ReturnType<typeof architectureAssets>[number];
