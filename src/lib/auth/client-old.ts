"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4444",
  plugins: [adminClient()],
  // Ensure credentials are included in requests
  credentials: "include",
});

export const { 
  useSession, 
  signIn, 
  signOut, 
  signUp,
  getSession 
} = authClient;

// Type-safe session hook
export type Session = typeof authClient.$Infer.Session;