import { InputValidationError, readEmail, readStrictObject, readString } from '@/libraries/utils/input-validation';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export function parseSignupInput(value: unknown): SignupInput {
  const input = readStrictObject(value, [
    'name',
    'email',
    'password',
  ]);
  const password = readString(input.password, 8);
  if (new TextEncoder().encode(password).length > 72) {
    throw new InputValidationError('Password must be at most 72 UTF-8 bytes.');
  }
  return {
    name: readString(input.name, 1, 100, true),
    email: readEmail(readString(input.email).trim()).toLowerCase(),
    password,
  };
}
