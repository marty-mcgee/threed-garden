// ==============================================================
// TITLE: Plans Page

// 'use client' // NO

// ==============================================================
// RESOURCES

// ** THREED: GET + SET DATA from API
// import getData from '#/lib/api/graphql/getData'
import Plans from '~/src/app/nouns/plans/Plans'

// ** APOLLO
// import { getClient } from '@/lib/apolloClient';
// import { getClient } from '@apollo/client-integration-nextjs/rsc'
// import { getClient } from '@apollo/client'
// import { preferencesStore } from '#/lib/api/graphql/apollo'
// import { gql } from '@apollo/client'
// import {
//   PreloadQuery
// } from '@apollo/client-integration-nextjs'
import {
  queries, // GetPlans,
} from '#/lib/api/graphql/apollo'


// import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '#/layout/ui/session-data'
// import CustomLink from '#/layout/ui/custom-link'

// ** Next
// import type { NextPage, NextPageContext } from 'next'
// import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// import Link from 'next/link'
// import { useRouter, usePathname } from 'next/navigation'

// ** React
// import type { ReactNode } from 'react'
import { 
  useEffect,
  Suspense,
} from 'react'

// ** RADIX-UI Imports
import {
  // Flex,
  // Grid,
  // Container,
  // Button, 
  Heading,
  // Text,
} from '@radix-ui/themes'
// ** PANELS Imports
// import { 
//   Panel, 
//   PanelGroup,
//   // PanelResizeHandle,
// } from 'react-resizable-panels'
// import PanelResizeHandle from '#/layout/ui/resize-handle'

// ** STYLE Imports
// import '#/layout/styles/styles-radix-ui-themes.css'
// import '#/layout/styles/styles-radix-ui-custom.css'
// import stylesPanels from '#/layout/styles/styles-panels.module.css'

// // ** LAYOUT Components (Head, Body, Foot)
// import Header from '#/layout/header'
// import Footer from '#/layout/footer'

// ** COMPONENT Imports
// import Logo from '#/layout/ui/logo'
// import FarmbotDemoSVG from '#/lib/farmbot/FarmbotDemoSVG'

// ** HELPER Imports
import Spinner from '#/layout/ui/spinner'
import ccm from '#/lib/utils/console-colors'

// ==============================================================

// ** DEBUGGING + TESTING
const debug: boolean = false

// if (debug) {
//   // console.debug('%c=======================================', ccm.black)
//   console.debug('%c🥕 ThreeDGarden<ThreeD>: {page.tsx}', ccm.greenAlert)
//   // console.debug('%c=======================================', ccm.black)
// }

// ==============================================================

// export default function Page<NextPage>() {
// const AppPage: NextPage<TPageProps> = (): React.ReactNode => {
// const AppPage: NextPage = (): React.ReactNode => {
// const AppPage: TNextPageWithProps = async (props: any): Promise<React.ReactNode> => {
// const AppPage: NextPage = (props) => {
// const AppPage = ({children}: {children: any}) => {
export default async function AppPage() {
  // **
  // console.debug('%c🥕 PROPS: AppPage.props', ccm.green, props)

  let QUERY = null
      QUERY = queries.GetPlans

  // ** Hooks YES !!!

  // ** GET + SET DATA from API
  // const data = getData()

  // ** AUTH (not here on server)
  // const auth = useAuth()
  // const session = useSession()
  // const session = await auth()
  // const session = {
  //   user: {
  //     name: 'hey hey hey',
  //   },
  //   expires: 'someday'
  // }

  // useEffect(() => {
  //   if (session) {
  //     if ('user' in session) {
  //       console.debug('NEXT-AUTH session.user', session)
  //     }
  //     // console.debug('NEXT-AUTH session', session)
  //   }
  //   return // nothing
  // }, [session]) // [session] ??

  // ** Return JSX
  return (
  
  <>
    <div
      style={{
        // display: 'flex',
        // flexDirection: 'row',
        textAlign: 'center',
      }}
    >
      <div
        className='PanelContent'
        style={{
          // display: 'flex',
          // flexDirection: 'row',
          textAlign: 'center',
          // border: '4px solid darkblue',
        }}
      >
        <Heading as='h1'>
          🥕 Plans
        </Heading>
        {/* <PreloadQuery
          query={QUERY}
          variables={{
            foo: 1,
          }}
        > */}
          <Suspense 
            fallback={
              // <>loading</>
              <><Spinner/></>
            }
          >
            <>Client: Query: GetPlans</>
            <Plans />
          </Suspense>
        {/* </PreloadQuery> */}
      </div>
    </div>
  </>
  )
}

// export default AppPage
