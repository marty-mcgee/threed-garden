// import { betterAuth } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/client";
import { user, session, account, verification } from "@/lib/auth/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4444", // Critical!
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
    autoSignIn: true,
  },
  plugins: [
    nextCookies() // make sure this is the last plugin in the array
  ],
  // Disable account linking and other features that might require Kysely
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  // Use simple session management
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // This ensures no Kysely-related features are loaded
  databaseHooks: {
    // Empty hooks to prevent Kysely migration attempts
  },
  // Disable advanced features that might pull in Kysely
  advanced: {
    cookiePrefix: "better-auth",
    // Required for HTTPS in production
    secureCookies: process.env.NODE_ENV === "production",
    sameSite: "lax",
    generateId: false,
  },
  // Trust the Vercel proxy
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "",
    "https://marty-mcgee-neon.vercel.app",
  ],
});

// Export auth types
export type Auth = typeof auth;