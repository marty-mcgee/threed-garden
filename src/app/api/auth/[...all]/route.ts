import { auth } from '@/lib/auth/server';
// import { minimalAuth as auth } from "@/lib/auth/minimal-server";
import { toNextJsHandler } from "better-auth/next-js";

// Ensure Node.js runtime (not edge)
export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth);