import NextAuth from 'next-auth'

// import Apple from 'next-auth/providers/apple'
import Auth0 from 'next-auth/providers/auth0'
// import Coinbase from 'next-auth/providers/coinbase'
// import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'
// import Google from 'next-auth/providers/google'
// import Instagram from 'next-auth/providers/instagram'
// import LinkedIn from 'next-auth/providers/linkedin'
// import Wordpress from 'next-auth/providers/wordpress'

import type { NextAuthConfig } from 'next-auth'

export const config = {
  theme: {
    logo: '/favicon/apple-touch-icon.png',
  },
  providers: [
    // Apple,
    Auth0,
    // Coinbase,
    // Facebook,
    GitHub,
    // Google,
    // Instagram,
    // LinkedIn,
    // Wordpress,
  ],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === '/middleware-example') return !!auth
      return true
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
