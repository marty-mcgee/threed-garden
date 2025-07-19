// ==============================================================
// FarmBot Page (main landing page for FarmBot JS Testing Environment)

// 'use server'
// 'use client'
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES


// ** NEXT Imports
// import type { NextPage } from 'next'
import dynamic from 'next/dynamic'

// ** FARMBOT Imports
// import { Farmbot } from 'farmbot'
import ThreeDFarmBot from '#/lib/farmbot/FarmBot'
// const ThreeDFarmBot = dynamic(() => import('#/lib/farmbot/FarmBot')) //, { ssr: false }

// ==============================================================
// ** EXPORT JSX as NEXT PAGE
// const FarmBotPage = (props) => {
// const FarmBotPage: NextPage<TPageProps> = (props) => {
// const FarmBotPage: NextPage = (): React.ReactNode => {
// const FarmBotPage: TNextPageWithProps = (): React.ReactNode => {
// export default function FarmBotPage<TNextPageWithProps> (): React.ReactNode { 
async function FarmBotPage<NextPage> () {
// function FarmBotPage<NextPage> () {
  
  // ** CANNOT USE HOOKS HERE

  // ** CAN USE COOKIES HERE
  // const panelLayoutGroups = await getPanelLayout()

  // ** RETURN JSX or React.ReactNode
  return (
    // {/* REACT SUSPENSE */}
    // <Suspense fallback={null}>
    // <Suspense fallback={<div>LOADING HEY HEY HEY ...</div>}>
      // <ThreeDHomeDesign panelLayout={panelLayoutGroups} />
      <ThreeDFarmBot />
    // </Suspense>
  )
}

export default FarmBotPage