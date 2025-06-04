// ==============================================================
// FarmBots Page

// 'use server' // YES, but SSR (handled by Next)
// 'use client' // NO
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES

// ** THREED: GET + SET DATA from API
// import getData from '#/lib/api/graphql/getData'
import FarmBots from '~/src/app/nouns/farmbots/FarmBots'

// // ** APOLLO Imports
import {
  queries, // GetFarmBots,
} from '#/lib/api/graphql/apollo'
// ** THREED APOLLO Imports
// import {
//   // ** AUTH
//   registerUser,
//   loginUser,
//   refreshJwtAuthToken,
//   // **
// } from '#/lib/api/graphql/apollo'

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

// ** NEXT Imports
// import type { NextPage } from 'next'
// import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// import dynamic from 'next/dynamic'
// import Image from 'next/image'
import { cookies } from 'next/headers'

// ** AUTH Imports
// import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '#/layout/ui/session-data'
// import CustomLink from '#/layout/ui/custom-link'

// ** THREED Imports
// import ThreeDHomeDesign from '#/lib/threed/HomeDesign'
// const ThreeDHomeDesign = dynamic(() => import('#/lib/threed/HomeDesign'), { ssr: false })

// ** TERRAINS Imports
// import Terrains from '#/lib/terrains/App'

// ** FARMBOTS Imports
// import { ThreeDGarden as ThreeDGardenFarmBots } from '#/lib/farmbot/frontend/three_d_garden'

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

async function getCookie(name: string) {
  const c = await cookies()
  return c.get(name)
}

async function getPanelLayout() {
  
  // ** default sizes
  let panelLayoutGroups = [
    [25, 75], 
    [50, 50], 
    [49, 51]
  ]
  
  const layoutGroup1 = await getCookie('react-resizable-panels:ThreeDPanelGroup1:layout')
  // console.debug('layoutGroup1', layoutGroup1)
  const layoutGroup2 = await getCookie('react-resizable-panels:ThreeDPanelGroup2:layout')
  // console.debug('layoutGroup2', layoutGroup2)
  const layoutGroup3 = await getCookie('react-resizable-panels:ThreeDPanelGroup3:layout')
  // console.debug('layoutGroup3', layoutGroup3)
  if (layoutGroup1?.value) {
    panelLayoutGroups[0] = JSON.parse(layoutGroup1.value)
  }
  if (layoutGroup2?.value) {
    panelLayoutGroups[1] = JSON.parse(layoutGroup2.value)
  }
  if (layoutGroup3?.value) {
    panelLayoutGroups[2] = JSON.parse(layoutGroup3.value)
  }
  
  return panelLayoutGroups
}

// ==============================================================
// ** EXPORT JSX as NEXT PAGE

// const FarmBotsPage = (props) => {
// const FarmBotsPage: NextPage<TPageProps> = (props) => {
// const FarmBotsPage: NextPage = (): React.ReactNode => {
// const FarmBotsPage: TNextPageWithProps = (): React.ReactNode => {
// const FarmBotsPage: TNextPageWithProps = (pages: any): React.ReactNode => {

// export default function FarmBotsPage<TNextPageWithProps> (): React.ReactNode { 
// export default async function FarmBotsPage<NextPage> () {
export default async function FarmBotsPage () {

  let QUERY = null
      QUERY = queries.GetFarmBots

  // ** CANNOT USE HOOKS HERE

  // ** CAN USE COOKIES HERE
  // const panelLayoutGroups = await getPanelLayout()

  // ** RETURN JSX or React.ReactNode
  return (
    // {/* REACT SUSPENSE */}
    // <Suspense fallback={null}>
    // <Suspense fallback={<div>LOADING HEY HEY HEY ...</div>}>
      // <ThreeDHomeDesign panelLayout={panelLayoutGroups} />
      // <Terrains />
      
      // <ThreeDGardenFarmBots 
      //   config={undefined} 
      //   addPlantProps={undefined} 
      //   mapPoints={[]} 
      //   weeds={[]}      
      // />
    
    // </Suspense>

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
            🥕 FarmBots
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
              <>Client: Query: GetFarmBots</>
              <FarmBots />
            </Suspense>
          {/* </PreloadQuery> */}
        </div>
      </div>
    </>
  )
}

// export default FarmBotsPage