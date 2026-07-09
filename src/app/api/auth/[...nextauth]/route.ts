// NEXT AUTH
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// BETTER AUTH
// app/api/auth/[...all]/route.ts
// import { auth } from '@/lib/auth/better-auth/server';
// // import { minimalAuth as auth } from "@/lib/auth/minimal-server";
// import { toNextJsHandler } from "better-auth/next-js";

// // Ensure Node.js runtime (not edge)
// export const runtime = 'nodejs';

// export const { GET, POST } = toNextJsHandler(auth);