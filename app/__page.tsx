'use client'

// ==============================================================
// Index Page (Forwarding Page)

// ** Next Imports
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

// ** React Imports
import { useEffect } from 'react'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Component Imports
// import DashboardLayout from '~/ui/elements/LayoutContainers/DashboardLayout'
// import DashboardNavbar from '~/ui/elements/Navbars/DashboardNavbar'

// ** Hook Imports
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
// import { EthPage as ETHPage } from '~~/components/main/EthPage'
import type { TPageProps } from '#/lib/types/TAppProps'

// import chalk from 'chalk'

// ==============================================================

// Set Home Forwarding (to First Page) URL, based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') {
    return '/acl' // authorized credentials list? (boundary)
  }
  else {
    // return '/' // this page (for testing. not ideal for production.)
    // return '/participate' // another page
    return '/home' // another page
  }
}

// Index Page (Forwarding Page)
// const Page: FC<TPageProps> = (props) => {
const Page: NextPage<TPageProps> = (props) => {
// const Page = (props) => {
  //
  // ** Hooks
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (auth.user && auth.user.role) {
      // get Home URL
      const homeRoute = getHomeRoute(auth.user.role)
      // redirect user to Home URL
      router.replace(homeRoute)
      console.debug('user AUTHORIZED', auth.user)
    } else {
      console.debug('user NOT AUTHORIZED', auth.user)
    }
  }, [])

  return (
    <>
      {/* <DashboardLayout> */}
        {/* <DashboardNavbar /> */}

        {/* <Typography component='h1' variant='h5' gutterBottom >
          ThreeD Garden for FarmBot + Three.js + Next.js
        </Typography>
        <Typography component='h2' variant='h6' gutterBottom >
          FarmBot + Three.js using React Three Fiber, MUI v5, NextJS + TypeScript
        </Typography>
        <Typography component='p' gutterBottom >
          Index Page (/pages/index.tsx)
        </Typography>
        <Typography component='p' gutterBottom >
          This page should call for action + handle response, or forward client, to a "Home" Landing Page.<br/>
          Shown here for TESTING PURPOSES ONLY.
        </Typography> */}

        <Spinner />

        {/* SCAFFOLD-ETH-TYPESCRIPT */}
        {/* <ETHPage pageName='threed' {...props}></ETHPage> */}
        {/* SCAFFOLD-ETH-TYPESCRIPT */}

      {/* </DashboardLayout> */}
    </>
  )
}

// Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page

// ORIGINAL / EXAMPLE
// import { demos } from '#/lib/demos';
// import Link from 'next/link';

// export default function Page() {
//   return (
//     <div className="space-y-8">
//       <h1 className="text-xl font-medium text-gray-300">Examples</h1>

//       <div className="space-y-10 text-white">
//         {demos.map((section) => {
//           return (
//             <div key={section.name} className="space-y-5">
//               <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
//                 {section.name}
//               </div>

//               <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
//                 {section.items.map((item) => {
//                   return (
//                     <Link
//                       href={`/${item.slug}`}
//                       key={item.name}
//                       className="group block space-y-1.5 rounded-lg bg-gray-900 px-5 py-3 hover:bg-gray-800"
//                     >
//                       <div className="font-medium text-gray-200 group-hover:text-gray-50">
//                         {item.name}
//                       </div>

//                       {item.description ? (
//                         <div className="line-clamp-3 text-sm text-gray-400 group-hover:text-gray-300">
//                           {item.description}
//                         </div>
//                       ) : null}
//                     </Link>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
