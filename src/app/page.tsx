// ==============================================================
// TITLE: Index Page (Forwarding Page)

'use client'

// ==============================================================
// RESOURCES

import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
import SessionData from '#/layout/session-data'
// import CustomLink from '~/src/layout/ui/custom-link'

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
  Flex,
  Grid,
  Container,
  Button, 
  Heading,
  Text,
} from '@radix-ui/themes'
// ** PANELS Imports
import { 
  Panel, 
  PanelGroup,
  // PanelResizeHandle,
} from 'react-resizable-panels'
import PanelResizeHandle from '#/layout/ui/resize-handle'

// ** STYLE Imports
// import '#/layout/styles/styles-radix-ui-themes.css'
// import '#/layout/styles/styles-radix-ui-custom.css'
import stylesPanels from '#/layout/styles/styles-panels.module.css'

// ** LAYOUT Components (Head, Body, Foot)
import Header from '#/layout/header'
import Footer from '#/layout/footer'

// ** COMPONENT Imports
import Logo from '#/layout/ui/logo'
import FarmbotDemoSVG from '#/lib/farmbot/FarmbotDemoSVG'

// ** Helper Components
import Spinner from '#/layout/ui/spinner'
// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<ThreeD>: {page.tsx}', ccm.greenAlert)
// console.debug('%c=======================================', ccm.black)

// ==============================================================

// export default function Page<NextPage>() {
// const AppPage: NextPage<TPageProps> = (): JSX.Element => {
// const AppPage: NextPage = (): JSX.Element => {
// const AppPage: TNextPageWithProps = async (props: any): Promise<JSX.Element> => {
// const AppPage: NextPage = (props) => {
// const AppPage = ({children}: {children: any}) => {
const AppPage = () => {
  // **
  // console.debug('%c🥕 PROPS: AppPage.props', ccm.green, props)

  // ** Hooks
  // const auth = useAuth()
  const session = useSession()
  // const session = await auth()
  // const session = {
  //   user: {
  //     name: 'hey hey hey',
  //   },
  //   expires: 'someday'
  // }

  useEffect(() => {
    if (session) {
      if ('user' in session) {
        console.debug('NEXT-AUTH session.user', session)
      }
      // console.debug('NEXT-AUTH session', session)
    }
    return // nothing
  }, [session]) // [session] ??

  // ** Return JSX
  return (
  
  <>
  <Suspense fallback={<Spinner />}>
    <Flex
      direction='row'

      style={{
        // height: '99%',
        // width: '99%',
        // paddingLeft: '8px',
        // paddingRight: '8px',
      }}
    > 
    
      <Flex
        direction='row'
        style={{
          // height: '10vh',
          // minHeight: '5vh',
          // width: '100%',
          // border: '4px solid darkblue',
        }}
      >
        <Header 
          key='ThreeDAppHeader'
        />
      </Flex>



      <Flex 
        direction='row'
        style={{
          height: '80vh',
          minHeight: '50vh',
          width: '100%',
          // border: '1px solid darkgray',
        }}
      >
        <PanelGroup 
          direction='vertical'
          autoSaveId='ThreeDAppLayout'
          id='MAINMAINPANELGROUP'
        >
          <Panel 
            className={stylesPanels.Panel}
            defaultSize={10}
            // maxSize={64}
            style={{
              // height: '80vh',
              // width: '100%',
              // border: '1px solid darkgreen',
            }}
          >
            {/* <Text>
              Main Header
            </Text> */}
            <Heading as='h1'>
              🥕 Welcome to ThreeD Garden
            </Heading>
          </Panel>
          <PanelResizeHandle />
          <Panel 
            className={stylesPanels.Panel}
            defaultSize={100}
            // maxSize={64}
            style={{
              // height: '80vh',
              // width: '100%',
              // border: '1px solid darkgreen',
            }}
          >
            <PanelGroup 
              direction='vertical'
              id='MAINPANELGROUP'
            >
              <Panel
                className={stylesPanels.Panel}
                defaultSize={10}
                // maxSize={640}
                style={{
                  // height: '80vh',
                  // width: '100%',
                  // border: '1px solid darkgreen',
                }}
              >
                <Container
                  className={stylesPanels.PanelContent}
                >
                  {/* <Text>
                    Sub Header
                  </Text> */}
                  <Heading as='h2'>
                    🌱 ThreeD: Next.js: app (router): page .tsx
                  </Heading>
                </Container>
              </Panel>
              
              <PanelResizeHandle />
              
              <Panel
                className={stylesPanels.Panel}
                defaultSize={100}
                // maxSize={64}
                style={{
                  // height: '80vh',
                  // width: '100%',
                  // border: '1px solid darkgreen',
                }}
              >
                <Grid
                  style={{
                    height: '100%',
                    // border: '1px solid purple',
                  }}
                >
                  <PanelGroup 
                    direction='horizontal'
                  >
                    <Panel
                      // className={stylesPanels.Panel}
                      defaultSize={16}
                      maxSize={32}
                      style={{
                        // height: '80vh',
                        // width: '30%',
                        // border: '1px solid darkred',
                      }}
                    >
                      <Text>
                        Sub Left
                      </Text>
                    </Panel>
                    <PanelResizeHandle />
                    <Panel
                      // className={stylesPanels.Panel}
                      defaultSize={84}
                      // maxSize={640}
                      style={{
                        // height: '80vh',
                        // width: '70%',
                        // border: '1px solid darkblue',
                      }}
                    >
                      <Grid 
                        id='ThreeDAppMain'
                        style={{
                          // height: '100%',
                          // width: '100%',
                          // border: '1px solid darkgreen',
                        }}
                      >
                        <Text>
                          Main Content (children)
                        </Text>
                        {/* <SessionData 
                          session={session} 
                        />
                        {
                          false && 
                          children
                        } */}
                        <FarmbotDemoSVG />
                      </Grid>
                    </Panel>
                  </PanelGroup>
                </Grid>
              </Panel>
            </PanelGroup>

          </Panel>
          
          <PanelResizeHandle />
          
          <Panel 
            className={stylesPanels.Panel}
            defaultSize={10}
            // maxSize={64}
            style={{
              // height: '80vh',
              width: '100%',
              // border: '1px solid darkgreen',
            }}
          >
            <Text>
              Sub Footer
            </Text>
          </Panel>
        </PanelGroup>
        
      </Flex>


      <Flex
        direction='row'
        style={{
          // height: '5vh',
          // minHeight: '5vh',
          // width: '100%',
          // border: '4px solid darkblue',
        }}
      >
        <Text>
          Main Footer
        </Text>
        <Footer 
          key='ThreeDAppFooter'
        />
      </Flex>
    </Flex>
  </Suspense>
  </>
  )
}

export default AppPage
