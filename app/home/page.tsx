// ==============================================================
// Home Page (main landing page for authorized user)

'use client'

// ** Next Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** React Imports
// import { useEffect } from 'react'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Layout Import
// import BlankLayout from '#/ui/layouts/BlankLayout'
import DashboardLayout from '~/ui/elements/LayoutContainers/DashboardLayout'
// import DashboardNavbar from '~/ui/elements/Navbars/DashboardNavbar'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
// import type { TPageProps } from '#/lib/types/TAppProps'

// ==============================================================

// Index Page (Forwarding Page)
// const Page = (props) => {
// const Page: FC<TPageProps> = (props) => {
// const Page: NextPage<TPageProps> = (props) => {
const Page: TNextPageWithProps = (): JSX.Element => {
  //

  return (
    <>
      {/* <DashboardLayout> */}
        {/* <DashboardNavbar /> */}

        <Typography component='h1' variant='h5' gutterBottom >
          ThreeD Garden for FarmBot + Three.js on React + Next.js 13
        </Typography>
        <Typography component='h2' variant='h6' >
          🌱 part of the threed.ai family
        </Typography>
        <Typography component='p' gutterBottom >
          Home Page (/app/home/page.tsx)
        </Typography>
        <Typography component='p' gutterBottom >
          This is the "Home" Landing Page.<br/>
        </Typography>

        {/* <Spinner /> */}

        {/* SCAFFOLD-ETH-TYPESCRIPT */}
        {/* <ETHPage pageName='threed' {...props}></ETHPage> */}
        {/* SCAFFOLD-ETH-TYPESCRIPT */}

      {/* </DashboardLayout> */}
    </>
  )
}

Page.getLayout = (page: any) => <DashboardLayout>{page}</DashboardLayout>
// Page.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
Page.guestGuard = true

export default Page
