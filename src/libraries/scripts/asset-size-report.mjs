// Pure read-only sizing contract. Bounds alone do not establish source units.
export function assetSizeReport(rawHeight, catalogScale, metresPerSceneUnit, targetMetres) {
  for (const [name, value] of Object.entries({ rawHeight, catalogScale, metresPerSceneUnit, ...(targetMetres === undefined ? {} : { targetMetres }) })) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive and finite.`);
  }
  const heightInSceneUnits = rawHeight * catalogScale;
  const heightMetres = heightInSceneUnits * metresPerSceneUnit;
  const multiplier = targetMetres === undefined ? undefined : targetMetres / heightMetres;
  if (![heightInSceneUnits, heightMetres, ...(multiplier === undefined ? [] : [multiplier])].every(n => Number.isFinite(n) && n > 0)) {
    throw new Error('Sizing calculation exceeds finite positive numeric bounds.');
  }
  return {
    rawHeight, catalogScale, metresPerSceneUnit,
    heightInSceneUnits, heightMetres,
    ...(targetMetres === undefined ? {} : { targetMetres, proposedInstanceMultiplier: multiplier }),
  };
}
