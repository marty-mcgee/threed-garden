// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

// 'use client'
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES

// ** REACT Imports
import {
  Suspense
} from 'react'

// ** NEXT Imports
// import type { NextPage } from 'next'
// import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// import dynamic from 'next/dynamic'
// import Image from 'next/image'

// ** APOLLO Imports
import { 
  // getApolloContext,

  // useApolloClient,
  // useReactiveVar,
  
  // useQuery,
  // useSuspenseQuery,
  // useBackgroundQuery,
  // useReadQuery,
  // useFragment
} from '@apollo/client'
import {
  // // stores,
  // preferencesStore,
  // canvasStateStore,
  // projectStore,
  // // queries,
  // // mutations,
  // // reactive state vars:
  // isPreferencesSetVar,
  // preferencesDataVar,
  // isCanvasStateSetVar,
  // canvasStateVar,
} from '#/lib/stores/apollo'

// import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '~/src/layout/ui/session-data'
// import CustomLink from '~/src/layout/ui/custom-link'

// ==============================================================
// ** THREED Imports
import ThreeDHomeDesign from '#/lib/home-design/src/HomeDesign'
// const ThreeDHomeDesign = dynamic(() => import('#/lib/home-design/src/HomeDesign'), { ssr: false })

// ==============================================================
// ** EXPORT JSX as NEXT PAGE
// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): JSX.Element => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
// export default function HomeDesignPage<TNextPageWithProps> (): JSX.Element { 
export default async function HomeDesignPage() {

  // ** stores
  // console.debug('HomeDesignPage: =================================')
  // console.debug('HomeDesignPage: stores', stores)
  // console.debug('HomeDesignPage: =================================')
  // console.debug('HomeDesignPage: getApolloContext()', getApolloContext())
  // console.debug('HomeDesignPage: preferencesStore', preferencesStore)
  // console.debug('HomeDesignPage: preferencesStore.store.getState()', preferencesStore.store.getState())
  // console.debug('HomeDesignPage: preferencesStore.actions.getState()', preferencesStore.actions.getState())
  // console.debug('HomeDesignPage: preferencesDataVar()', preferencesDataVar())
  // console.debug('HomeDesignPage: canvasStateVar()', canvasStateVar())
  
  // const revenue = await fetchRevenue() // delete this line

  // ** RETURN JSX or React.ReactNode
  return (
    <Suspense fallback={<>ThreeD Home Design: HEY HEY HEY</>}>
      <ThreeDHomeDesign />
    </Suspense>
  )
}
