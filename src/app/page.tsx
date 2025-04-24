// ==============================================================
// TITLE: Index Page (Forwarding Page)

// 'use client' // NO

// ==============================================================
// RESOURCES

// ** THREED: GET + SET DATA from API
// import getData from '#/lib/api/graphql/getData'
import ClientPreferences from '~/src/app/nouns/preferences/Preferences'

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
  queries, // GetPreferences,
} from '#/lib/api/graphql/apollo'


// import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '#/layout/ui/session-data'
// import CustomLink from '#/layout/ui/custom-link'

// ** Next
// import type { NextPage, NextPageContext } from 'next'
// import type { TNextPageWithProps } from '#/lib/types/TAppProps'
import Link from 'next/link'
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

if (debug) {
  // console.debug('%c=======================================', ccm.black)
  console.debug('%c🥕 ThreeDGarden<ThreeD>: {page.tsx}', ccm.greenAlert)
  // console.debug('%c=======================================', ccm.black)
}

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
      QUERY = queries.GetPreferences

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
          🌱 Welcome to ThreeD Garden
        </Heading>
      </div>

      <div 
        className='PanelContent'
        style={{
          // display: 'flex',
          // flexDirection: 'column',
          // border: '1px solid darkgray',
        }}
      >
        <Heading 
          as='h4'
          style={{
            textAlign: 'center',
          }}
        >
          ThreeD: Next.js: app (router): page .tsx
        </Heading>
        <div>
          ________________<br/><br/>
        </div>
        {/* <FarmbotDemoSVG /> */}
      </div>
      <div
        style={{
          display: 'flex',
          // flexDirection: 'row',
          width: '100%',
        }}
      >
        <div
          style={{
            // display: 'flex',
            // flexDirection: 'column',
            width: '33%',
          }}
        >
          <Heading as='h3'>
            🥕 Nouns
          </Heading>
          <ul
            className='ListMenu'
            style={{
              listStyleType: 'none',
              marginLeft: '-32px',
            }}
          >
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
            
            <li 
              key='page-Users'
            >
              <Link href='/nouns/users'>Users</Link>
            </li>
            <li 
              key='page-Participants'
            >
              <Link href='/nouns/participants'>Participants</Link>
            </li>
            <li 
              key='page-Preferences'
            >
              <Link href='/nouns/preferences'>Preferences</Link>
            </li>
            <li 
              key='page-Projects'
            >
              <Link href='/nouns/projects'>Projects</Link>
            </li>
            <li 
              key='page-Plans'
            >
              <Link href='/nouns/plans'>Plans</Link>
            </li>
            <li 
              key='page-ThreeDs'
            >
              <Link href='/nouns/threeds'>ThreeDs</Link>
            </li>
            <li 
              key='page-Characters'
            >
              <Link href='/nouns/characters'>Characters</Link>
            </li>
            <li 
              key='page-Files'
            >
              <Link href='/nouns/files'>Files</Link>
            </li>
            <li 
              key='page-FarmBots'
            >
              <Link href='/nouns/farmbots'>FarmBots</Link>
            </li>
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
            
          </ul>
        </div>
        <div
          style={{
            // display: 'flex',
            // flexDirection: 'column',
            width: '34%',
          }}
        >
          <Heading as='h3'>
            🥬 Examples
          </Heading>
          <ul
            className='ListMenu'
            style={{
              listStyleType: 'none',
              marginLeft: '-32px',
            }}
          >
            {/* <li key='page-Example-Characters'>
              <Link href='/examples/characters'>Character Demo</Link>
            </li> */}
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
            
            <li 
              key='page-Example-Home-Design'
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/home-design' 
                title='Home Design Page'
                className='ListMenuItem'
              >
                🟢 DEMO: FULL
              </Link>
            </li>
            
            <li 
              key='page-Example-Participate'
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/participate' 
                title='Participate Page'
                className='ListMenuItem'
              >
                🟣 DEMO: BASIC
              </Link>
            </li>
            
            <li 
              key='page-Example-Characters'
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/examples/characters' 
                title='Characters Page'
                className='ListMenuItem'
              >
                🔵 DEMO: CHARACTERS
              </Link>
            </li>
            
            <li 
              key='page-Example-Terrains'
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/examples/terrains' 
                title='Terrains Page'
                className='ListMenuItem'
              >
                🟤 DEMO: TERRAINS
              </Link>
            </li>
            
            <li 
              key='page-Example-FarmBots'
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/examples/farmbots' 
                title='FarmBots Page'
                className='ListMenuItem'
              >
                ⚫ DEMO: FARMBOTS
              </Link>
            </li>
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>

            <li
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/chat/openai' 
                title='ThreeD: OpenAI Chat Page'
                className='ListMenuItem'
                // style={{
                //   backgroundColor: '#222222', 
                //   color: '#888888',
                //   textDecoration: 'none',
                //   borderWidth: 0,
                //   // marginTop: 0,
                //   // padding: 0,
                //   fontSize: 12,
                // }}
              >
                🔵 CHAT: OpenAI
              </Link>
            </li>
            
            <li 
              className='ListMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/chat/deepseek' 
                title='ThreeD: DeepSeek Chat Page'
                className='ListMenuItem'
                // style={{
                //   backgroundColor: '#222222', 
                //   color: '#888888',
                //   textDecoration: 'none',
                //   borderWidth: 0,
                //   // marginTop: 0,
                //   // padding: 0,
                //   fontSize: 12,
                // }}
              >
                🔵 CHAT: DeepSeek
              </Link>
            </li>
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
            
          </ul>
        </div>
        <div
          style={{
            // display: 'flex',
            // flexDirection: 'column',
            width: '33%',
          }}
        >
          <Heading as='h3'>
            🍅 Resources
          </Heading>
          <ul
            className='ListMenu'
            style={{
              listStyleType: 'none',
              marginLeft: '-32px',
            }}
          >
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
          
            <li key='page-Example-Characters'>
              <Link href='https://my.farm.bot' target='_blank'>FarmBot UI</Link>
            </li>
            
            <li
              className='ListMenuItem'
            >
              ________________________
            </li>
            
          </ul>
        </div>
      </div>
    </div>
  </>
  )
}

// export default AppPage
