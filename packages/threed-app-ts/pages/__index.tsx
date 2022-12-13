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
// import DashboardLayout from '~/components/elements/LayoutContainers/DashboardLayout'
// import DashboardNavbar from '~/components/elements/Navbars/DashboardNavbar'

// ** Hook Imports
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
// import { EthPage as ETHPage } from '~~/components/main/EthPage'
import { TPageProps } from '~#/lib/types/models/TAppProps'

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
