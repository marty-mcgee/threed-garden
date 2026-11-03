/** Small, dependency-free input checks shared by explicit App parsers. */
export class InputValidationError extends Error {
  constructor(message = 'Invalid input.') {
    super(message);
    this.name = 'InputValidationError';
  }
}

export type InputResult<T> =
  | {
    success: true;
    data: T;
  }
  | {
    success: false;
    error: InputValidationError;
  };

export function tryParseInput<T>(parse: (value: unknown) => T, value: unknown): InputResult<T> {
  try {
    return {
      success: true,
      data: parse(value),
    };
  } catch (error) {
    if (error instanceof InputValidationError) return {
      success: false,
      error,
    };
    throw error;
  }
}

export function readObject(value: unknown): Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') throw new InputValidationError();
  return value as Record<string, unknown>;
}

export function readStrictObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const object = readObject(value);
  if (Object.keys(object).some(key => !keys.includes(key))) throw new InputValidationError();
  return object;
}

export function readString(value: unknown, minimum = 0, maximum = Infinity, trim = false): string {
  if (typeof value !== 'string') throw new InputValidationError();
  const result = trim ? value.trim() : value;
  if (result.length < minimum || result.length > maximum) throw new InputValidationError();
  return result;
}

export function readNumber(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) throw new InputValidationError();
  return value;
}

export function readInteger(value: unknown, minimum: number, maximum = Infinity): number {
  const number = readNumber(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) throw new InputValidationError();
  return number;
}

export function readBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new InputValidationError();
  return value;
}

export function readChoice<T extends string>(value: unknown, choices: readonly T[]): T {
  const choice = choices.find(item => item === value);
  if (choice === undefined) throw new InputValidationError();
  return choice;
}

export function readGuid(value: unknown): string {
  const guid = readString(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid)) throw new InputValidationError();
  return guid;
}

export function readRevision(value: unknown): string {
  const revision = readString(value);
  if (!/^[a-f0-9]{64}$/.test(revision)) throw new InputValidationError();
  return revision;
}

export function readEmail(value: unknown): string {
  const email = readString(value, 0, 254);
  if (!/^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i.test(email)) throw new InputValidationError();
  return email;
}

export function readArray(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) throw new InputValidationError();
  return value;
}
