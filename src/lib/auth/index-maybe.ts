// lib/auth/index.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/client';
import { 
  User,
  UserAccounts,
  UserSessions,
  UserVerifications,
} from '@/lib/schema/auth';
import Credentials from 'next-auth/providers/credentials';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// For v5, NextAuth returns { handlers, auth, signIn, signOut }
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    provider: 'pg',
    schema: {
      users: User,
      accounts: UserAccounts,
      sessions: UserSessions,
      verificationTokens: UserVerifications,
    },
  }),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { email, password, name, action } = credentials as {
            email: string;
            password: string;
            name?: string;
            action?: string;
          };

          // Handle sign-up
          if (action === 'signup') {
            const existingUser = await db
              .select()
              .from(User)
              .where(eq(User.email, email))
              .limit(1);

            if (existingUser && existingUser.length > 0) {
              throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [newUser] = await db
              .insert(User)
              .values({
                name: name || email.split('@')[0],
                email,
                isActive: true,
                role: 'user',
              })
              .returning();

            await db.insert(UserAccounts).values({
              userId: newUser.id,
              type: 'credentials',
              provider: 'credentials',
              providerAccountId: newUser.id,
              password: hashedPassword,
            });

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            };
          }

          // Handle sign-in
          const user = await db
            .select()
            .from(User)
            .where(eq(User.email, email))
            .limit(1);

          if (!user || !user[0]) {
            return null;
          }

          const passwordAccount = await db
            .select()
            .from(UserAccounts)
            .where(
              and(
                eq(UserAccounts.userId, user[0].id),
                eq(UserAccounts.provider, 'credentials')
              )
            )
            .limit(1);

          if (!passwordAccount || !passwordAccount[0]) {
            return null;
          }

          const storedPassword = passwordAccount[0].password || '';

          const passwordMatch = await bcrypt.compare(
            password,
            storedPassword
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
            role: user[0].role,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  trustHost: true,
});