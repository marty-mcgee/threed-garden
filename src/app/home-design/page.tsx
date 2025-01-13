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
  const layout1 = cookies().get('react-resizable-panels:ThreeDPanelGroup1:layout')
  // console.debug('layout1', layout1)
  const layout2 = cookies().get('react-resizable-panels:ThreeDPanelGroup2:layout')
  // console.debug('layout2', layout2)
  const layout3 = cookies().get('react-resizable-panels:ThreeDPanelGroup3:layout')
  // console.debug('layout3', layout3)
  let panelLayout = [[25, 75], [50, 50], [49, 51]] // default sizes
  if (layout1) {
    panelLayout[0] = JSON.parse(layout1.value)
  }
  if (layout2) {
    panelLayout[1] = JSON.parse(layout2.value)
  }
  if (layout3) {
    panelLayout[2] = JSON.parse(layout3.value)
  }
  return panelLayout
}

// ==============================================================
// ** EXPORT JSX as NEXT PAGE
// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): JSX.Element => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
// export default function HomeDesignPage<TNextPageWithProps> (): JSX.Element { 
export default async function HomeDesignPage() {

  const panelLayout = getPanelLayout()

  // ** RETURN JSX or React.ReactNode
  return (
    <Suspense fallback={null}>
      <ThreeDHomeDesign panelLayout={panelLayout} />
    </Suspense>
  )
}
