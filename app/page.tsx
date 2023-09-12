// ==============================================================
// TITLE: Index Page (Forwarding Page)

'use client'

// ==============================================================
// RESOURCES (to import)

// ** Next
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

// ** React
// import type { ReactNode } from 'react'
// import React, { FC } from 'react'
import { useEffect } from 'react'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {page.tsx}', ccm.green)
// console.debug('%c=======================================', ccm.black)

// ==============================================================

// Set Home Forwarding (to First Page) URL, based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') {
    // return '/home' // another page
    return '/participate' // another page
    // return '/acl' // authorized credentials list? (boundary)
  }
  else if (role === 'admin') {
    // return '/' // this page (for testing. not ideal for production.)
    return '/home' // another page
    // return '/participate' // another page
  }
  else {
    // return '/' // this page (for testing. not ideal for production.)
    return '/auth/login'
  }
}

// ==============================================================

// export default function Page<NextPage>() {
// const AppPage: NextPage<TPageProps> = (): JSX.Element => {
// const AppPage: NextPage = (): JSX.Element => {
const AppPage: TNextPageWithProps = (props: any): JSX.Element => {
  // **
  // console.debug('%c🥕 PROPS: AppPage.props', ccm.green, props)

  // ** Hooks
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // ** OnMount (+ optional return OnUnmount)
  // useEffect(() => {
    // user AUTHORIZED?
    if (auth.user && auth.user.role) {
      // get Home URL
      const homeRoute = getHomeRoute(auth.user.role)
      console.debug('✅ user AUTHORIZED', auth.user, 'go to:', homeRoute)
      // redirect authorized user to Home URL
      router.replace(homeRoute)
    }
    // user NOT AUTHORIZED!
    else {
      const homeRoute = getHomeRoute('unauthorized')
      console.debug('❌ user NOT AUTHORIZED', auth.user, 'go to:', homeRoute)
      // redirect un-authorized guest to Home URL
      router.replace(homeRoute)
    }
    // return <></>
  // }, [])

// ==============================================================

  // ** Return JSX
  return <Spinner />
}
// AppPage.getLayout = (page: any) => {page} // <BlankLayout>{page}</BlankLayout>
// AppPage.setConfig = () => true
// AppPage.authGuard = false
// AppPage.guestGuard = false
// AppPage.acl = {}

/*
AppPage.getInitialProps = async (ctx: NextPageContext) => {
//   const res = await fetch('https://api.github.com/repos/vercel/next.js')
//   const json = await res.json()
//   return { stars: json.stargazers_count }
// }
// export async function getServerSideProps() {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  // const allPosts = await getAllPostsForHome(preview)
  // console.debug('getServerSideProps on AppLayout')
  console.debug('getInitialProps on AppPage', ctx)
  return {
    props: {
      // Component: {
        getLayout: 'YO YO YO',
        setConfig: 'true',
        authGuard: false,
        guestGuard: true,
        acl: {}, // aclObjectDefault, // acl, {},
        auth: {},
      // },
    },
    revalidate: 10,
    testTestTest: true,
    context: ctx,
  }
}
*/
// export async function getServerSideProps() {
// // export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
// // export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
//   // const allPosts = await getAllPostsForHome(preview)
//   console.debug('getServerSideProps on AppPage')
//   return {
//     props: {
//       Component: {
//         getLayout: 'HEY HEY HEY',
//         setConfig: 'true',
//         authGuard: false,
//         guestGuard: true,
//         acl: {}, // aclObjectDefault, // acl,
//       }
//     },
//     revalidate: 10,
//   }
// }

/*
// export async function getStaticProps() {
export async function getServerSideProps() {
  // let req = httpMocks.createRequest()
  // let res = httpMocks.createResponse()
  // async function callMids(req, res, index, ...mids) {
  //   index = index || 0
  //   if (index <= mids.length - 1)
  //     await mids[index](req, res, () => callMids(req, res, ++index, ...mids))
  // }
  // await callMids(
  //   req,
  //   res,
  //   null,
  //   dbConnectMid,
  //   logger,
  //   newsController.sendAllNews
  // )
  return {
    // props: { news: res._getJSONData() },
    props: {
    //   // Component: {
    //     // getLayout: 'HEY HEY HEY',
    //     // setConfig: 'true',
    //     // authGuard: false,
    //     // guestGuard: true,
    //     // acl: {}, // aclObjectDefault, // acl,
    //   // }
    }
  }
}
*/

export default AppPage
