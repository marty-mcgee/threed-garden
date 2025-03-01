// 'use server' // uses this default
// 'use client' // do not use in next.js root layout
// ^ this file should need NO pragma: default is 'use server'

// ==============================================================
// ** DEFAULT APP ROOT LAYOUT

// ** NEXT Imports
// import dynamic from 'next/dynamic'

// ** CSS Imports
import '#/layout/styles/styles-tailwind-globals.css'
import '#/layout/styles/styles-radix-ui-custom.css'
import '#/layout/styles/styles-panels.module.css'
// ** THREED CSS Imports
import '#/lib/threed/styles/threed-home-design.css'
import '#/lib/threed/styles/annotations.css'
// ** FONT Imports
import { inter } from '#/layout/styles/fonts'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloClientWrapper } from '#/lib/api/graphql/ApolloClientWrapper'

// ** NEXT AUTH -- Client Session Management
import SessionWrapper from '#/layout/SessionWrapper'

// ** LAYOUT Components (Header, Main, Footer)
// import Header from '#/layout/header'
// const Header = dynamic(() => import('#/layout/header'), { ssr: false })
import Header from '#/layout/header-client'
import Footer from '#/layout/footer'
// const Footer = dynamic(() => import('#/layout/footer'), { ssr: false })

// ** Google Analytics
import { GoogleAnalytics } from '@next/third-parties/google'

// ** HELPER Imports
import ccm from '#/lib/utils/console-colors'

// const appVersion: string = 'v0.17.0'
const appVersion: string = require('package.json').version

// ==============================================================

export const metadata = {
  title: 'ThreeD Garden',
  description: 'ThreeD Garden Next JS App by Marty McGee',
}

// ==============================================================
// MAIN APP ROOT LAYOUT ('use server')

// basic React Provider context node with props.children
export default function RootLayout({ children }: { children: any }) {

  console.debug('%c🌱 RootLayout: appVersion', ccm.darkgreenAlert, appVersion)

  const gaId = 'G-B6H82RQ83V' // 'G-XXXXXXXXXX'
  
  // **
  return (
    <html lang='en' className='antialiased'>
      <body className={`${inter.className} antialiased`}>
        <ApolloClientWrapper>
          <SessionWrapper>
            <Header 
              key='ThreeDAppHeader'
            />
            <div
              id='ThreeDAppMain'
            >
              {children}
            </div>
            <Footer 
              key='ThreeDAppFooter'
            />
          </SessionWrapper>
        </ApolloClientWrapper>
      </body>
      <GoogleAnalytics gaId={gaId} />
    </html>
  )
}
