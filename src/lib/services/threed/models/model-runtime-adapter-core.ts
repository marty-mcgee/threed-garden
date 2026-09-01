const MAX_RUNTIME_ADAPTER_KEY_LENGTH = 80;
const RUNTIME_ADAPTER_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const THREED_MODEL_RUNTIME_ADAPTER_METADATA_KEY = 'runtimeAdapterKey';

/**
 * Reads a source-controlled visual adapter hint from reusable Model metadata.
 *
 * The value is only a registry lookup key. It is never treated as source code,
 * a module path, a URL, or Project/Scene authority.
 */
export function readThreeDModelRuntimeAdapterKey(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return null;
  }

  const candidate = (metadata as Record<string, unknown>)[
    THREED_MODEL_RUNTIME_ADAPTER_METADATA_KEY
  ];
  if (typeof candidate !== 'string') return null;

  const key = candidate.trim();
  if (
    key.length === 0
    || key.length > MAX_RUNTIME_ADAPTER_KEY_LENGTH
    || !RUNTIME_ADAPTER_KEY_PATTERN.test(key)
  ) {
    return null;
  }

  return key;
}
