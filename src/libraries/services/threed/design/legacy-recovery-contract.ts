import type { DesignDocument } from './document';

/** Local operator recovery bundle, not an App API payload or saved Design schema. */
export interface LegacyRecoveryFile {
  path: string;
  sha256: string;
  bytes: number;
  role: 'model' | 'other' | 'texture';
}
export interface LegacyRecoveryAsset {
  key: string;
  legacyName: string;
  modelName: string;
  files: LegacyRecoveryFile[];
  attribution: { author: string; license: string };
  scale: [number, number, number];
}
export interface LegacyRecoveryPlacement {
  legacyId: string;
  variantKey: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  levelId: string;
}
export interface LegacyRecoveryPackage {
  format: 'threed-legacy-recovery';
  version: 1;
  /** Digest of the exact source plan, source files and prepared content. */
  fingerprint: string;
  sourcePlanSha256: string;
  architecture: DesignDocument;
  assets: LegacyRecoveryAsset[];
  placements: LegacyRecoveryPlacement[];
  warnings: string[];
}

export interface LegacyRecoveryReceipt {
  version: 1;
  fingerprint: string;
  userId: string;
  projectId: number;
  threedId: number;
  models: { key: string; modelId: number }[];
  markerCount: number;
  operation: 'created' | 'existing';
}
