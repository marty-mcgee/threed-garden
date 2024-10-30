// 'use client' // do not use
// 'use server' // uses this default
// ^ this file should need NO pragma: default is 'use server'

// ==============================================================
// ** DEFAULT APP ROOT LAYOUT

// ** LAYOUT Imports
import { Inter } from 'next/font/google'
import '#/layout/styles/styles-tailwind-globals.css'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloClientWrapper } from '#/lib/api/graphql/ApolloClientWrapper'

// ** NEXT AUTH -- Client Session Management
import SessionWrapper from '#/layout/SessionWrapper'
// ** CLERK AUTH -- External User Authentication
import { ClerkProvider } from '@clerk/nextjs'

// ** HELPER Imports
// ** Colorful Console Messages
// import ccm from '#/lib/utils/console-colors'
// ** Google Analytics
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ['latin'] })

// ==============================================================

export const metadata = {
  title: 'ThreeD Garden',
  description: 'ThreeD Garden Next JS App by Marty McGee',
}

// ==============================================================
// MAIN APP ROOT LAYOUT ('use server')

// basic React Provider context node with props.children
export default function RootLayout({ children }: { children: any }) {

  // console.debug('%c 🥕 RootLayout', ccm.darkgreenAlert, true)

  const gaId = 'G-B6H82RQ83V' // 'G-XXXXXXXXXX'
  
  // **
  return (
    <html lang='en' className='antialiased'>
      <body className={inter.className}>
        <ApolloClientWrapper>
          <SessionWrapper>
            <ClerkProvider>
              {children}
            </ClerkProvider>
          </SessionWrapper>
        </ApolloClientWrapper>
      </body>
      <GoogleAnalytics gaId={gaId} />
    </html>
  )
}
