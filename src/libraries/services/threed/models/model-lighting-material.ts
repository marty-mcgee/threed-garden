import * as THREE from 'three';

/** Clone lit materials before changing them: Group.clone shares material references. */
export function applyModelLightBoost(group: THREE.Group, boost: number): void {
  if (!(boost > 0 && boost <= 1)) return;
  group.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    const brighten = (source: THREE.Material): THREE.Material => {
      if (!(source instanceof THREE.MeshStandardMaterial || source instanceof THREE.MeshPhongMaterial || source instanceof THREE.MeshLambertMaterial)) return source;
      const material = source.clone();
      if (material.emissiveMap || material.emissive.getHex() !== 0) {
        material.emissiveIntensity *= 1 + boost;
      } else {
        material.emissive.copy(material.color);
        if (material.map) material.emissiveMap = material.map;
        material.emissiveIntensity = boost;
      }
      return material;
    };
    child.material = Array.isArray(child.material) ? child.material.map(brighten) : brighten(child.material);
  });
}
