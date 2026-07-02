// lib/auth/server.ts

// import { betterAuth } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/client";
// import { user, session, account, verification } from "@/lib/schema";
import { 
  user, 
  userAccounts, 
  userSessions, 
  userVerifications 
} from '@/lib/schema/auth';

export const auth = betterAuth({

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4444", // Critical!

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
      account: userAccounts,
      session: userSessions,
      verification: userVerifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // autoSignIn: true,
  },

  // Add secret for production
  secret: process.env.BETTER_AUTH_SECRET,

  plugins: [
    nextCookies() // make sure this is the last plugin in the array
  ],
  
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID || '',
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  //   },
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID || '',
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  //   },
  // },

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
    // Don't use secure cookies in development
    useSecureCookies: process.env.NODE_ENV === "production",
    sameSite: "lax",
    generateId: false,
    // // Explicit cookie domain
    // cookieDomain: process.env.NODE_ENV === "production" 
    //   ? ".vercel.app" 
    //   : undefined,
    // Don't set domain for Vercel subdomains
    cookieDomain: undefined,
    // Set path to root
    cookiePath: "/",
    // Increase cookie max age (7 days)
    sessionExpiresIn: 60 * 60 * 24 * 7,
  },

  // Trust the Vercel proxy
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "",
    "http://localhost:3333",
    "https://threed-garden-neon.vercel.app",
    "https://threedgarden.com",
    "http://localhost:4444",
    "https://marty-mcgee-neon.vercel.app",
    "https://marty-mcgee.com",
  ],
  
  // Disable CSRF for API routes (or configure properly)
  // csrf: {
  //   enabled: true,
  //   ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  // },
  // Disable CSRF for testing
  csrf: {
    enabled: false,
  },

  
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
      },
      displayName: {
        type: 'string',
        required: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      theme: {
        type: 'string',
        required: false,
        defaultValue: 'system',
      },
      language: {
        type: 'string',
        required: false,
        defaultValue: 'en',
      },
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'UTC',
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    },
  },

});

// Export auth types
export type Auth = typeof auth;





