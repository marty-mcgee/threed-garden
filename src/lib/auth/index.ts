// lib/auth/index.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/client';
import { 
  User,
  UserAccounts,
  UserVerifications,
} from '@/lib/schema/auth';
import Credentials from 'next-auth/providers/credentials';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: User,
    accountsTable: UserAccounts,
    verificationTokensTable: UserVerifications,
  }),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await db
            .select()
            .from(User)
            .where(eq(User.email, credentials.email as string))
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
            credentials.password as string,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/auth/error', // ✅ This points to your error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // ✅ Only debug in development
  trustHost: true, // ✅ Important for production
});
