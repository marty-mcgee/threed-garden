/** Validate existing fields without changing their server contract or saved source configuration. */
export function validateCharacterDraft(form: Record<string, string | boolean>) {
  if (!String(form.characterId).trim() || !String(form.name).trim()) throw new Error('Character ID and name are required.');
  for (const key of ['animations', 'patrolWaypoints', 'teleportPositions']) {
    let value: unknown;
    try { value = JSON.parse(String(form[key])); } catch { throw new Error(`${key} must be valid JSON.`); }
    if (!Array.isArray(value)) throw new Error(`${key} must be a JSON array.`);
  }
  let metadata: unknown;
  try { metadata = JSON.parse(String(form.metadata)); } catch { throw new Error('Metadata must be valid JSON.'); }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Metadata must be a JSON object.');
  for (const key of ['positionX', 'positionY', 'positionZ', 'rotation', 'scale', 'scaleMultiplier', 'animationSpeed', 'movementSpeed', 'movementRadius', 'followDistance', 'visibleDistance']) {
    const value = String(form[key]);
    if (value !== '' && !Number.isFinite(Number(value))) throw new Error(`${key} must be a finite number.`);
    if (value !== '' && ['scale', 'scaleMultiplier', 'animationSpeed'].includes(key) && Number(value) <= 0) throw new Error(`${key} must be greater than zero.`);
    if (value !== '' && ['movementSpeed', 'movementRadius', 'followDistance', 'visibleDistance'].includes(key) && Number(value) < 0) throw new Error(`${key} must not be negative.`);
  }
  for (const key of ['activeStartHour', 'activeEndHour', 'teleportInterval', 'modelId']) {
    const raw = String(form[key]);
    if (raw === '') continue;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 0 || (key === 'modelId' && value === 0) || (key.includes('Hour') && value > 23)) throw new Error(`${key} must be a valid whole number.`);
  }
}
