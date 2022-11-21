// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Component Imports

// ** Hook Imports
import { useAuth } from '~/hooks/useAuth'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
import { MainPage as ETHPage } from '~~/components/main/MainPage'
import { TPageProps } from '~~/models/TAppProps'

// Set Home URL based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') return '/acl'
  else return '/participate' // '/' // this page
}

// Page
// const Page: FC<TPageProps> = (props) => {
const Page: NextPage<TPageProps> = (props) => {
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
      {/* <Spinner /> */}

      <Typography
        component='h1'
        variant='h5'
        gutterBottom
      >
        ThreeD Garden for FarmBot + Three
      </Typography>
      {/* <Typography
        component='h2'
        variant='h6'
        gutterBottom
      >
        FarmBot + Three.js using React Three Fiber, MUI v5, NextJS + TypeScript
      </Typography> */}

      {/* SCAFFOLD-ETH-TYPESCRIPT */}
      <ETHPage pageName='main' {...props}></ETHPage>
      {/* SCAFFOLD-ETH-TYPESCRIPT */}
    </>
  )
}

export default Page
