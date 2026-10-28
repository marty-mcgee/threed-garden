import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8).refine(value => new TextEncoder().encode(value).length <= 72,
    'Password must be at most 72 UTF-8 bytes.'),
}).strict();
