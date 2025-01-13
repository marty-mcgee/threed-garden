// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

// 'use server'
// 'use client'
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES

// ** REACT Imports
import {
  Suspense
} from 'react'

// ** NEXT Imports
import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
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
import ThreeDHomeDesign from '~/src/lib/threed/HomeDesign'
// const ThreeDHomeDesign = dynamic(() => import('#/lib/threed/HomeDesign'), { ssr: false })

// ==============================================================

function getPanelLayout() {
  const layoutGroup1 = cookies().get('react-resizable-panels:ThreeDPanelGroup1:layout')
  // console.debug('layoutGroup1', layoutGroup1)
  const layoutGroup2 = cookies().get('react-resizable-panels:ThreeDPanelGroup2:layout')
  // console.debug('layoutGroup2', layoutGroup2)
  const layoutGroup3 = cookies().get('react-resizable-panels:ThreeDPanelGroup3:layout')
  // console.debug('layoutGroup3', layoutGroup3)
  let panelLayoutGroups = [[25, 75], [50, 50], [49, 51]] // default sizes
  if (layoutGroup1) {
    panelLayoutGroups[0] = JSON.parse(layoutGroup1.value)
  }
  if (layoutGroup2) {
    panelLayoutGroups[1] = JSON.parse(layoutGroup2.value)
  }
  if (layoutGroup3) {
    panelLayoutGroups[2] = JSON.parse(layoutGroup3.value)
  }
  return panelLayoutGroups
}

// ==============================================================
// ** EXPORT JSX as NEXT PAGE
// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): JSX.Element => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
// export default function HomeDesignPage<TNextPageWithProps> (): JSX.Element { 
export default async function HomeDesignPage() {

  const panelLayoutGroups = getPanelLayout()

  // ** RETURN JSX or React.ReactNode
  return (
    <Suspense fallback={null}>
      <ThreeDHomeDesign panelLayout={panelLayoutGroups} />
    </Suspense>
  )
}
