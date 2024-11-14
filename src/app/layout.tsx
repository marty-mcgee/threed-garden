// 'use server' // uses this default
// 'use client' // do not use in next.js root layout
// ^ this file should need NO pragma: default is 'use server'

// ==============================================================
// ** DEFAULT APP ROOT LAYOUT

// ** NEXT Imports
import dynamic from 'next/dynamic'

// ** STYLE Imports
import { Inter } from 'next/font/google'
import '#/layout/styles/styles-tailwind-globals.css'
// import '#/layout/styles/styles-radix-ui-themes.css'
// import '#/layout/styles/styles-radix-ui-custom.css'
import '#/lib/home-design/src/styles/radix-ui.css'
import '#/layout/styles/styles-panels.module.css'
// ** THREED CSS Imports
import '#/lib/home-design/src/styles/threed-home-design.css'
// import '#/lib/home-design/src/styles/annotations.css'
// import '#/lib/home-design/src/styles/fa-550.css'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloClientWrapper } from '#/lib/api/graphql/ApolloClientWrapper'

// ** NEXT AUTH -- Client Session Management
import SessionWrapper from '#/layout/SessionWrapper'
// ** CLERK AUTH -- External User Authentication
import { ClerkProvider } from '@clerk/nextjs'

// ** LAYOUT Components (Head, Body, Foot)
// import Header from '#/layout/header'
const Header = dynamic(() => import('#/layout/header'), { ssr: false })
// import Footer from '#/layout/footer'
const Footer = dynamic(() => import('#/layout/footer'), { ssr: false })

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
            <ClerkProvider dynamic>
              <Header 
                key='ThreeDAppHeader'
              />
              <>
                {children}
              </>
              <Footer 
                key='ThreeDAppFooter'
              />
            </ClerkProvider>
          </SessionWrapper>
        </ApolloClientWrapper>
      </body>
      <GoogleAnalytics gaId={gaId} />
    </html>
  )
}
