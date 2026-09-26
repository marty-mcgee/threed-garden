/** Scenario guidance consumes snapshots; it never owns or changes Scene objects. */
export type ScenarioKind = 'soccer' | 'farming';
export interface ScenarioAsset {
  id: string;
  type: string;
  active: boolean;
  ball: boolean;
  sensors: readonly { id: string; behavior: string; detection: string; groupId: string | null }[];
}
export interface ScenarioCheck { id: string; label: string; complete: boolean }
export function evaluateScenario(input: {
  kind: ScenarioKind;
  assets: readonly ScenarioAsset[];
  environmentId: string;
  groupId: string;
  groupIds: readonly string[];
}): ScenarioCheck[] {
  const assets = input.assets.filter(asset => asset.active);
  const checks: ScenarioCheck[] = [{
    id: 'environment', label: 'Choose an assigned field or environment Model',
    complete: assets.some(asset => asset.id === input.environmentId && asset.type === 'models'),
  }];
  if (input.kind === 'soccer') {
    const counters = new Set(assets.flatMap(asset => asset.sensors
      .filter(sensor => sensor.behavior === 'counter' && sensor.detection === 'movable-ball'
        && sensor.groupId === input.groupId)
      .map(sensor => JSON.stringify([asset.id, sensor.id]))));
    checks.push(
      { id: 'ball', label: 'Assign a Model with movable-ball physics', complete: assets.some(asset => asset.type === 'models' && asset.ball) },
      { id: 'group', label: 'Choose a Sensor Group', complete: input.groupIds.includes(input.groupId) },
      { id: 'counters', label: 'Assign at least two ball-entry counters to that group', complete: input.groupIds.includes(input.groupId) && counters.size >= 2 },
    );
  } else {
    for (const [type, label] of [['beds', 'Assign a Bed'], ['plantings', 'Assign a Planting'], ['farmbots', 'Assign a FarmBot']] as const) {
      checks.push({ id: type, label, complete: assets.some(asset => asset.type === type) });
    }
  }
  return checks;
}
