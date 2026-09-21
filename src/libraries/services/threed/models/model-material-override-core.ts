export const THREED_MODEL_MATERIAL_OVERRIDE_VERSION = 1 as const;
export const THREED_MODEL_MATERIAL_OVERRIDE_LIMIT = 500;

export interface ThreeDModelMaterialOverrideAssignment {
  targetKey: string;
  channel: 'baseColor';
  textureRelativePath: string;
}

export interface ThreeDModelMaterialOverrides {
  version: typeof THREED_MODEL_MATERIAL_OVERRIDE_VERSION;
  assignments: ThreeDModelMaterialOverrideAssignment[];
}

export function isThreeDModelMaterialTargetKey(value: unknown): value is string {
  return typeof value === 'string' && /^mesh:(?:0|[1-9]\d{0,5}):material:(?:0|[1-9]\d{0,3})$/.test(value);
}

export function readThreeDModelMaterialOverrides(metadata: unknown): ThreeDModelMaterialOverrides {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { version: THREED_MODEL_MATERIAL_OVERRIDE_VERSION, assignments: [] };
  }
  const value = (metadata as Record<string, unknown>).materialOverrides;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { version: THREED_MODEL_MATERIAL_OVERRIDE_VERSION, assignments: [] };
  }
  const record = value as Record<string, unknown>;
  if (record.version !== THREED_MODEL_MATERIAL_OVERRIDE_VERSION || !Array.isArray(record.assignments)) {
    return { version: THREED_MODEL_MATERIAL_OVERRIDE_VERSION, assignments: [] };
  }
  const assignments = record.assignments.slice(0, THREED_MODEL_MATERIAL_OVERRIDE_LIMIT).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const assignment = item as Record<string, unknown>;
    if (
      !isThreeDModelMaterialTargetKey(assignment.targetKey)
      || assignment.channel !== 'baseColor'
      || typeof assignment.textureRelativePath !== 'string'
      || !assignment.textureRelativePath
      || assignment.textureRelativePath.length > 500
    ) return [];
    return [{
      targetKey: assignment.targetKey,
      channel: 'baseColor' as const,
      textureRelativePath: assignment.textureRelativePath,
    }];
  });
  return { version: THREED_MODEL_MATERIAL_OVERRIDE_VERSION, assignments };
}

export function writeThreeDModelMaterialOverride(
  metadata: unknown,
  assignment: ThreeDModelMaterialOverrideAssignment,
): Record<string, unknown> {
  const source = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
  const current = readThreeDModelMaterialOverrides(source);
  const assignments = current.assignments.filter((item) => !(
    item.targetKey === assignment.targetKey && item.channel === assignment.channel
  ));
  assignments.push(assignment);
  if (assignments.length > THREED_MODEL_MATERIAL_OVERRIDE_LIMIT) {
    throw new Error(`A Model cannot exceed ${THREED_MODEL_MATERIAL_OVERRIDE_LIMIT} material overrides`);
  }
  return {
    ...source,
    materialOverrides: {
      version: THREED_MODEL_MATERIAL_OVERRIDE_VERSION,
      assignments,
    },
  };
}
