// ==============================================================
// ThreeD Garden Page (main landing page for 3D Character Demo)

'use client'

// ==========================================================
// RESOURCES

// ** AUTH GUARD
// import { auth } from 'auth'
// import { SessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'

// ** NEXT Imports
import dynamic from 'next/dynamic'
// import Image from 'next/image'
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** REACT Imports
// import { Suspense } from 'react'

// ** RADIX-UI Imports
// import {
//   Grid,
// } from '@radix-ui/themes'
// // ** MUI Imports
// import Grid from '@mui/material/Grid'
// import Card from '@mui/material/Card'
// import CardHeader from '@mui/material/CardHeader'
// import Typography from '@mui/material/Typography'
// import CardContent from '@mui/material/CardContent'

// // ** LAYOUT Components (Head, Body, Foot)
// import Header from '#/layout/header'
// import Footer from '#/layout/footer'

// ** THREED Components Imports
// import ThreeDComponents from '#/lib/threed/threed'
const ThreeDComponents = dynamic(() => import('#/lib/threed/ThreeDComponents'), { ssr: false })
// import ThreeDControls from '~/src/lib/threed/Controls'
// const ThreeDControls = dynamic(() => import('#/lib/threed/Controls'), { ssr: false })
// import ThreeDGarden from '~/src/lib/threed/ThreeDGarden'
// const ThreeDGarden = dynamic(() => import('#/lib/threed/ThreeDGarden'), { ssr: false })
// import ThreeDControls from '#/lib/threed/components/controls/Controls'
// const ThreeDControls = dynamic(() => import('#/lib/threed/components/controls/Controls'), { ssr: false })

// ** HELPER Imports
// import Spinner from '#/layout/ui/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
// import ccm from '#/lib/utils/console-colors'

const ParticipatePage: TNextPageWithProps = (): JSX.Element => {
// const ParticipatePage: TNextPageWithProps = async () => {
// const ParticipatePage: TNextPageWithProps = async ({ children }: React.PropsWithChildren): Promise<JSX.Element> => {
  // **
  // const session = await auth()
  const { data: session, status } = useSession()
  // filter out sensitive data before passing to client.
  // if (session) {
    // console.debug('%c Participate page: session', ccm.greenAlert, session)
    // if (session?.user) {
    //   session.user = {
    //     name: session.user.name,
    //     email: session.user.email,
    //     image: session.user.image,
    //   }
    // }
  // }
  // else {
  //   console.debug('%c Participate page: NO session', ccm.redAlert)
  // }
  // let session = {
  //   user: {
  //     name: 'Marty',
  //     email: 'mcgee.marty@gmail.com',
  //     image: './images/logos/threed-garden.png'
  //   },
  //   expires: Date.now().toLocaleString(), // 'datetime as string',
  // }

  return (
    <ThreeDComponents />
  )
}

// const ParticipatePage_UseClient = dynamic(() => Promise.resolve(ParticipatePage), {
//   ssr: false
// })
// export default ParticipatePage_UseClient
export default ParticipatePage
