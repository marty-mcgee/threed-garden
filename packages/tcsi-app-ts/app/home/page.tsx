// ==============================================================
// Home Page (main landing page for authorized user)

'use client'

// ** Next Imports
import type { NextPage } from 'next'

// ** React Imports
// import { useEffect } from 'react'

// ** MUI Components
import Typography from '@mui/material/Typography'

// ** Component Imports
// import DashboardLayout from '~/components/elements/LayoutContainers/DashboardLayout'
// import DashboardNavbar from '~/components/elements/Navbars/DashboardNavbar'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
import type { TPageProps } from '#/lib/types/TAppProps'

// ==============================================================

// Index Page (Forwarding Page)
// const Page = (props) => {
// const Page: FC<TPageProps> = (props) => {
const Page: NextPage<TPageProps> = (props) => {
  //

  return (
    <>
      {/* <DashboardLayout> */}
        {/* <DashboardNavbar /> */}

        <Typography component='h1' variant='h5' >
          tCSi + Next.js 13
        </Typography>
        <Typography component='h2' variant='h6' >
          the Creative Spirit incorporated
        </Typography>
        <Typography component='p' >
          Home Page (/app/home/page.tsx)
        </Typography>
        <Typography component='p' gutterBottom >
          This is the "Home" Landing Page.
          <br/>
        </Typography>

        {/* <Spinner /> */}

        {/* SCAFFOLD-ETH-TYPESCRIPT */}
        {/* <ETHPage pageName='threed' {...props}></ETHPage> */}
        {/* SCAFFOLD-ETH-TYPESCRIPT */}

      {/* </DashboardLayout> */}
    </>
  )
}

// Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
