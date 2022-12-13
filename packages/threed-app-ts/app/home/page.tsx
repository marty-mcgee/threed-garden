// ==============================================================
// Home Page (main landing page for authorized user)

// 'use client'

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
import { TPageProps } from '~~/types/models/TAppProps'

// ==============================================================

// Index Page (Forwarding Page)
// const Page: FC<TPageProps> = (props) => {
const Page: NextPage<TPageProps> = (props) => {
// const Page = (props) => {
  //

  return (
    <>
      {/* <DashboardLayout> */}
        {/* <DashboardNavbar /> */}

        <Typography component='h1' variant='h5' gutterBottom >
          ThreeD Garden for FarmBot + Three.js + Next.js
        </Typography>
        <Typography component='h2' variant='h6' gutterBottom >
          FarmBot + Three.js using React Three Fiber, MUI v5, NextJS + TypeScript
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

// Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
