/** A Scenario detail observes Project assignments; it does not configure the Scenario. */
export type ScenarioInventoryAsset = { assetType: string };

export function summarizeScenarioInventory(assets: readonly ScenarioInventoryAsset[]) {
  const count = (type: string) => assets.filter(asset => asset.assetType === type).length;
  const models = count('threed_models');
  const characters = count('threed_characters');
  const garden = count('threed_beds') + count('threed_plantings');
  const farmbots = count('threed_farmbots');
  const other = assets.length - models - characters - garden - farmbots;
  return {
    total: assets.length,
    counts: { models, characters, garden, farmbots, other },
    nextAction: assets.length === 0 ? 'Add the first Project asset' : models === 0 ? 'Add a Model to this Project' : 'Review Project assets',
  } as const;
}
