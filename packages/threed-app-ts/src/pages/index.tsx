// ** Next Imports
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

// ** React Imports
import { useEffect } from 'react'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Component Imports
// ThreeD Garden examples components
import DashboardLayout from '~/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '~/components/elements/Navbars/DashboardNavbar'

// ** Hook Imports
import { useAuth } from '~/hooks/useAuth'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
// import { MainPage as ETHPage } from '~~/components/main/MainPage'
import { TPageProps } from '~~/models/TAppProps'

import chalk from 'chalk'

// ==============================================================

// Set Home URL based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') {
    return '/acl' // authorized credentials list? (boundary)
  }
  else {
    return '/' // this page
    // return '/participate' // another page
  }
}

// Page
// const Page: FC<TPageProps> = (props) => {
const Page: NextPage<TPageProps> = (props) => {
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
      console.debug(chalk.green('user AUTHORIZED'), auth.user)
    } else {
      console.debug(chalk.red('user NOT AUTHORIZED'), auth.user)
    }
  }, [])

  return (
    <>
      {/* <DashboardLayout> */}
        {/* <DashboardNavbar /> */}

        {/* <Spinner /> */}

        <Typography
          component='h1'
          variant='h5'
          gutterBottom
        >
          ThreeD Garden for FarmBot + Three.js + Next.js
        </Typography>
        {/* <Typography
          component='h2'
          variant='h6'
          gutterBottom
        >
          FarmBot + Three.js using React Three Fiber, MUI v5, NextJS + TypeScript
        </Typography> */}

        {/* SCAFFOLD-ETH-TYPESCRIPT */}
        {/* <ETHPage pageName='main' {...props}></ETHPage> */}
        {/* SCAFFOLD-ETH-TYPESCRIPT */}

      {/* </DashboardLayout> */}
    </>
  )
}

// Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
