'use client'
// 'use server'

/*
Tip: A single route can effectively contain both a layout and a template, with the layout serving as an outer shell that encases the template within it. https://www.builder.io/blog/nextjs-14-layouts-templates
*/


// ** LAYOUT Components (Head, Body, Foot)
import Header from '#/layout/header'
import Footer from '#/layout/footer'
// // const Header = dynamic(() => import('#/layout/header').then((mod) => mod), { ssr: false })
// // const Footer = dynamic(() => import('#/layout/footer').then((mod) => mod), { ssr: false })
// const Header = dynamic(() => import('#/layout/header'), { ssr: false })
// const Footer = dynamic(() => import('#/layout/footer'), { ssr: false })



// ** CSS Styles
// ** TAILWIND CSS
import '#/layout/styles/globals.css' // global tailwind css
// ** Radix UI CSS
import '@radix-ui/themes/styles.css' // radix-ui theme default css in node_modules
// import '#/layout/styles/radix-ui-themes-styles.css' // copied from default, for editing
// ** CUSTOM CSS (DOMINANT OVERRIDES)
// import '#/layout/styles/custom-styles.css' // custom css
// ** PANELS CSS
import styles from '#/layout/styles/styles.module.css'

// ** PANELS Imports
import { 
  Panel, 
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'

import { useEffect, Suspense } from 'react'
import SessionWrapper from './SessionWrapper'
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client'
// import { client } from '#/lib/api/graphql/__client'
// import { getClient } from '#/lib/api/graphql/__client'


const client = new ApolloClient({
  uri: 'https://threed.design/',
  cache: new InMemoryCache(),
})

const RootLayoutWrapper = ({children}: {children: any}) => {
  // **
  console.debug('RootLayoutWrapper loading...')
  // useEffect(() => {
  //   console.debug('RootLayoutWrapper loaded.')
  // }, [])
  // **
  return (
    <Suspense fallback={null}>
      <SessionWrapper>
        <ApolloProvider client={client}>
          <Header />
          <>
            <div
              className={styles.Container}
            >
              {children}
            </div>
          </>
          <Footer />
        </ApolloProvider>
      </SessionWrapper>
    </Suspense>
  )
}

export default RootLayoutWrapper