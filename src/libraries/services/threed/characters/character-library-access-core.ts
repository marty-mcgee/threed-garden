export type ThreeDCharacterRuntime = 'garden' | 'ecctrl';

export type ThreeDCharacterLibraryAccessIssue =
  | 'invalid_character_id'
  | 'character_inactive'
  | 'character_hidden'
  | 'missing_character_model'
  | 'character_model_mismatch'
  | 'model_inactive'
  | 'model_not_for_characters'
  | 'model_file_missing';

export interface ThreeDCharacterLibraryCandidate {
  id: unknown;
  isActive: unknown;
  status: unknown;
  visible: unknown;
  isMovable: unknown;
  modelId: unknown;
}

export interface ThreeDCharacterModelCandidate {
  id: unknown;
  isActive: unknown;
  status: unknown;
  usedByCharacters: unknown;
  filePath: unknown;
}

export interface ThreeDCharacterLibraryAccess {
  eligible: boolean;
  runtime: ThreeDCharacterRuntime;
  issues: ThreeDCharacterLibraryAccessIssue[];
}

function positiveId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Resolves Character Library eligibility before a Character reaches the
 * Project placement path, ThreeD Scene, or Rapier.
 *
 * Character records own runtime behavior. Their related model supplies only
 * the visual and must be explicitly classified for Character use. A movable
 * Character routes to Ecctrl; a non-movable Character routes to
 * GardenCharacter. This function never changes either record.
 */
export function resolveThreeDCharacterLibraryAccess(
  character: ThreeDCharacterLibraryCandidate,
  model: ThreeDCharacterModelCandidate | null,
): ThreeDCharacterLibraryAccess {
  const issues: ThreeDCharacterLibraryAccessIssue[] = [];
  const characterId = positiveId(character.id);
  const characterModelId = positiveId(character.modelId);
  const modelId = model ? positiveId(model.id) : null;

  if (!characterId) issues.push('invalid_character_id');
  if (character.isActive !== true || character.status !== 'active') {
    issues.push('character_inactive');
  }
  if (character.visible === false) issues.push('character_hidden');
  if (!characterModelId || !model) {
    issues.push('missing_character_model');
  } else if (!modelId || modelId !== characterModelId) {
    issues.push('character_model_mismatch');
  }

  if (model) {
    if (model.isActive !== true || model.status !== 'active') {
      issues.push('model_inactive');
    }
    if (model.usedByCharacters !== true) {
      issues.push('model_not_for_characters');
    }
    if (typeof model.filePath !== 'string' || model.filePath.trim().length === 0) {
      issues.push('model_file_missing');
    }
  }

  return {
    eligible: issues.length === 0,
    runtime: character.isMovable === true ? 'ecctrl' : 'garden',
    issues,
  };
}
