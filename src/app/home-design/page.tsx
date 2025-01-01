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
  const layout = cookies().get('react-resizable-panels:layout')
  if (layout) {
    return JSON.parse(layout.value)
  }
  return [24, 76]
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
