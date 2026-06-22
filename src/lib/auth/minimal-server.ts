// lib/auth/minimal-server.ts
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { user, session, account, verification } from "@/lib/schema";

// Simple auth without any extra features
export const minimalAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Disable social providers for now
  socialProviders: {},
});

// // Use this in your API routes temporarily
// // app/api/music/route.ts
// import { minimalAuth as auth } from "@/lib/auth/minimal-server";
// // ... rest of the code