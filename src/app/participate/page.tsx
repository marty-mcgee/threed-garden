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

// ** THREED Components Imports
// import ThreeDComponents from '#/lib/threed/threed'
const ThreeDComponents = dynamic(() => import('#/lib/threed/ThreeDComponents'), { ssr: false })

// ** HELPER Imports
// import ccm from '#/lib/utils/console-colors'

// const ParticipatePage: TNextPageWithProps = (): React.ReactNode => {
const ParticipatePage: TNextPageWithProps = (pages: any): React.ReactNode => {
// const ParticipatePage: TNextPageWithProps = async () => {
// const ParticipatePage: TNextPageWithProps = async ({ children }: React.PropsWithChildren): Promise<React.ReactNode> => {
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

export default ParticipatePage
