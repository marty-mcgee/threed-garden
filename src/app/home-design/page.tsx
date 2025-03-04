// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

'use server'
// 'use client'
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES

// // ** APOLLO Imports
// import {
//   useMutation,
// } from '@apollo/client'
// // ** THREED APOLLO Imports
// import {
//   // ** AUTH
//   registerUser,
//   loginUser,
//   refreshJwtAuthToken,
//   // **
// } from '#/lib/api/graphql/apollo'

// ** REACT Imports
// import {
//   Suspense
// } from 'react'

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
import ThreeDHomeDesign from '#/lib/threed/HomeDesign'
// const ThreeDHomeDesign = dynamic(() => import('#/lib/threed/HomeDesign'), { ssr: false })

// ==============================================================

export async function getCookie(name: string) {
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
// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): React.ReactNode => {
// const HomeDesignPage: TNextPageWithProps = (): React.ReactNode => {
// export default function HomeDesignPage<TNextPageWithProps> (): React.ReactNode { 
async function HomeDesignPage() {
// const HomeDesignPage: TNextPageWithProps = (pages: any): React.ReactNode => {

  // ** CANNOT USE HOOKS HERE

  // ** CAN USE COOKIES HERE
  const panelLayoutGroups = await getPanelLayout()

  // ** RETURN JSX or React.ReactNode
  return (
    // {/* REACT SUSPENSE */}
    // <Suspense fallback={null}>
    // <Suspense fallback={<div>LOADING HEY HEY HEY ...</div>}>
      <ThreeDHomeDesign panelLayout={panelLayoutGroups} />
    // </Suspense>
  )
}

export default HomeDesignPage
