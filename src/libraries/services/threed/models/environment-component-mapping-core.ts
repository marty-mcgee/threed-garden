import type { ThreeDModelSourceComponent } from './environment-collision-core';

export const THREED_ENVIRONMENT_COMPONENT_MAPPING_VERSION = 1 as const;
export const MAX_THREED_ENVIRONMENT_MAPPING_RULES = 64;
export const MAX_THREED_ENVIRONMENT_MAPPING_COMPONENTS = 100_000;
const MAX_RULE_ID_LENGTH = 64;
const MAX_SELECTOR_VALUE_LENGTH = 240;
const MAX_REPRESENTATIVE_PATHS = 5;

export const THREED_ENVIRONMENT_COMPONENT_ROLES = [
  'terrain',
  'structure',
  'barrier',
  'vehicle',
  'vegetation',
  'decoration',
  'interaction',
  'unclassified',
] as const;

export const THREED_ENVIRONMENT_CONSTRUCTION_STRATEGIES = [
  'visual-only',
  'bounds-per-component',
  'spatially-merged-bounds',
  'simplified-trimesh',
] as const;

export const THREED_ENVIRONMENT_SELECTOR_KINDS = [
  'source-path-exact',
  'source-path-prefix',
] as const;

export type ThreeDEnvironmentComponentRole = typeof THREED_ENVIRONMENT_COMPONENT_ROLES[number];
export type ThreeDEnvironmentConstructionStrategy = typeof THREED_ENVIRONMENT_CONSTRUCTION_STRATEGIES[number];
export type ThreeDEnvironmentSelectorKind = typeof THREED_ENVIRONMENT_SELECTOR_KINDS[number];

export interface ThreeDEnvironmentComponentMappingRule {
  id: string;
  role: ThreeDEnvironmentComponentRole;
  selector: {
    kind: ThreeDEnvironmentSelectorKind;
    value: string;
  };
  constructionStrategy: ThreeDEnvironmentConstructionStrategy;
}

export interface ThreeDEnvironmentComponentMapping {
  version: typeof THREED_ENVIRONMENT_COMPONENT_MAPPING_VERSION;
  rules: ThreeDEnvironmentComponentMappingRule[];
}

export interface ThreeDEnvironmentMappingRulePreview {
  ruleId: string;
  role: ThreeDEnvironmentComponentRole;
  constructionStrategy: ThreeDEnvironmentConstructionStrategy;
  componentCount: number;
  triangleCount: number;
  representativeSourcePaths: string[];
}

export interface ThreeDEnvironmentComponentMappingPreview {
  version: typeof THREED_ENVIRONMENT_COMPONENT_MAPPING_VERSION;
  sourceComponentCount: number;
  sourceTriangleCount: number;
  matchedComponentCount: number;
  matchedTriangleCount: number;
  unmatchedComponentCount: number;
  unmatchedTriangleCount: number;
  conflictingComponentCount: number;
  conflictingTriangleCount: number;
  collisionCandidateComponentCount: number;
  collisionCandidateTriangleCount: number;
  rules: ThreeDEnvironmentMappingRulePreview[];
  representativeUnmatchedPaths: string[];
  representativeConflictPaths: string[];
}

export class ThreeDEnvironmentComponentMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThreeDEnvironmentComponentMappingError';
  }
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function hasExactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

function readBoundedText(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== 'string') throw new ThreeDEnvironmentComponentMappingError(`${label} must be text`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new ThreeDEnvironmentComponentMappingError(`${label} is invalid`);
  }
  return normalized;
}

/** Strictly parses a reviewed mapping. Extra fields and duplicate selectors fail closed. */
export function parseThreeDEnvironmentComponentMapping(
  input: unknown,
): ThreeDEnvironmentComponentMapping {
  const root = asRecord(input);
  if (!root || !hasExactKeys(root, ['version', 'rules'])) {
    throw new ThreeDEnvironmentComponentMappingError('Mapping must contain only version and rules');
  }
  if (root.version !== THREED_ENVIRONMENT_COMPONENT_MAPPING_VERSION) {
    throw new ThreeDEnvironmentComponentMappingError('Unsupported mapping version');
  }
  if (!Array.isArray(root.rules) || root.rules.length < 1 || root.rules.length > MAX_THREED_ENVIRONMENT_MAPPING_RULES) {
    throw new ThreeDEnvironmentComponentMappingError(`Mapping must contain 1-${MAX_THREED_ENVIRONMENT_MAPPING_RULES} rules`);
  }

  const ruleIds = new Set<string>();
  const selectors = new Set<string>();
  const rules = root.rules.map((candidate, index): ThreeDEnvironmentComponentMappingRule => {
    const rule = asRecord(candidate);
    if (!rule || !hasExactKeys(rule, ['id', 'role', 'selector', 'constructionStrategy'])) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${index + 1} has unsupported fields`);
    }
    const id = readBoundedText(rule.id, `Rule ${index + 1} ID`, MAX_RULE_ID_LENGTH);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ruleIds.has(id)) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${index + 1} ID is invalid or duplicated`);
    }
    ruleIds.add(id);
    if (!isOneOf(rule.role, THREED_ENVIRONMENT_COMPONENT_ROLES)) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${id} role is unsupported`);
    }
    if (!isOneOf(rule.constructionStrategy, THREED_ENVIRONMENT_CONSTRUCTION_STRATEGIES)) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${id} construction strategy is unsupported`);
    }
    const selector = asRecord(rule.selector);
    if (!selector || !hasExactKeys(selector, ['kind', 'value'])) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${id} selector is invalid`);
    }
    if (!isOneOf(selector.kind, THREED_ENVIRONMENT_SELECTOR_KINDS)) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${id} selector kind is unsupported`);
    }
    const selectorValue = readBoundedText(selector.value, `Rule ${id} selector value`, MAX_SELECTOR_VALUE_LENGTH);
    const selectorKey = `${selector.kind}\u0000${selectorValue}`;
    if (selectors.has(selectorKey)) {
      throw new ThreeDEnvironmentComponentMappingError(`Rule ${id} duplicates an existing selector`);
    }
    selectors.add(selectorKey);
    return {
      id,
      role: rule.role,
      selector: { kind: selector.kind, value: selectorValue },
      constructionStrategy: rule.constructionStrategy,
    };
  });

  return { version: THREED_ENVIRONMENT_COMPONENT_MAPPING_VERSION, rules };
}

function ruleMatchesComponent(
  rule: ThreeDEnvironmentComponentMappingRule,
  component: ThreeDModelSourceComponent,
): boolean {
  return rule.selector.kind === 'source-path-exact'
    ? component.sourcePath === rule.selector.value
    : component.sourcePath.startsWith(rule.selector.value);
}

/**
 * Applies reviewed selectors to bounded structural evidence only. Conflicting
 * matches remain unassigned and no collider descriptions or physics objects are created.
 */
export function previewThreeDEnvironmentComponentMapping(
  input: unknown,
  sourceComponents: readonly ThreeDModelSourceComponent[],
): ThreeDEnvironmentComponentMappingPreview {
  const mapping = parseThreeDEnvironmentComponentMapping(input);
  if (sourceComponents.length > MAX_THREED_ENVIRONMENT_MAPPING_COMPONENTS) {
    throw new ThreeDEnvironmentComponentMappingError('Source component count exceeds preview limit');
  }
  const ruleResults = mapping.rules.map((rule) => ({
    ruleId: rule.id,
    role: rule.role,
    constructionStrategy: rule.constructionStrategy,
    componentCount: 0,
    triangleCount: 0,
    representativeSourcePaths: [] as string[],
  }));
  let sourceTriangleCount = 0;
  let matchedComponentCount = 0;
  let matchedTriangleCount = 0;
  let unmatchedComponentCount = 0;
  let unmatchedTriangleCount = 0;
  let conflictingComponentCount = 0;
  let conflictingTriangleCount = 0;
  let collisionCandidateComponentCount = 0;
  let collisionCandidateTriangleCount = 0;
  const representativeUnmatchedPaths: string[] = [];
  const representativeConflictPaths: string[] = [];

  for (const component of sourceComponents) {
    if (
      typeof component.sourcePath !== 'string'
      || !component.sourcePath
      || component.sourcePath.length > MAX_SELECTOR_VALUE_LENGTH
      || !Number.isSafeInteger(component.triangleCount)
      || component.triangleCount < 0
    ) {
      throw new ThreeDEnvironmentComponentMappingError('Source component evidence is invalid');
    }
    sourceTriangleCount += component.triangleCount;
    if (!Number.isSafeInteger(sourceTriangleCount)) {
      throw new ThreeDEnvironmentComponentMappingError('Source triangle total exceeds safe integer range');
    }
    const matches: number[] = [];
    mapping.rules.forEach((rule, index) => {
      if (ruleMatchesComponent(rule, component)) matches.push(index);
    });
    if (matches.length === 0) {
      unmatchedComponentCount += 1;
      unmatchedTriangleCount += component.triangleCount;
      if (representativeUnmatchedPaths.length < MAX_REPRESENTATIVE_PATHS) {
        representativeUnmatchedPaths.push(component.sourcePath);
      }
      continue;
    }
    if (matches.length > 1) {
      conflictingComponentCount += 1;
      conflictingTriangleCount += component.triangleCount;
      if (representativeConflictPaths.length < MAX_REPRESENTATIVE_PATHS) {
        representativeConflictPaths.push(component.sourcePath);
      }
      continue;
    }
    const ruleIndex = matches[0];
    const rule = mapping.rules[ruleIndex];
    const result = ruleResults[ruleIndex];
    matchedComponentCount += 1;
    matchedTriangleCount += component.triangleCount;
    result.componentCount += 1;
    result.triangleCount += component.triangleCount;
    if (result.representativeSourcePaths.length < MAX_REPRESENTATIVE_PATHS) {
      result.representativeSourcePaths.push(component.sourcePath);
    }
    if (rule.constructionStrategy !== 'visual-only') {
      collisionCandidateComponentCount += 1;
      collisionCandidateTriangleCount += component.triangleCount;
    }
  }

  return {
    version: mapping.version,
    sourceComponentCount: sourceComponents.length,
    sourceTriangleCount,
    matchedComponentCount,
    matchedTriangleCount,
    unmatchedComponentCount,
    unmatchedTriangleCount,
    conflictingComponentCount,
    conflictingTriangleCount,
    collisionCandidateComponentCount,
    collisionCandidateTriangleCount,
    rules: ruleResults,
    representativeUnmatchedPaths,
    representativeConflictPaths,
  };
}
