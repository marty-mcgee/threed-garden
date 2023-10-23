// ==============================================================
// RESOURCES
// ** DEFAULT APP TEMPLATE -- LAYOUT WRAPPER
// template.tsx -- for Next.js 13
// ?? FOR ENTIRE APP CONTEXTS ??

'use client'

// ** React
// import type { ReactNode } from 'react'

// ** Next
import { AppProps } from 'next/app'

// // ** Contexts for User Authorization + Settings
// import { AuthProvider } from '#/lib/contexts/AuthContext'

// ** User Authorization Hook *** [MM] CUSTOM CODE HOOK
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Layout + Metadata Components
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your main layout

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {template.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP TEMPLATE

// const AppTemplate = ({ children }: { children: ReactNode }): JSX.Element => {
const AppTemplate = ({ children }: any, { Component, pageProps }: AppProps): JSX.Element => {

  // ** Props.children
  // const { children } = props
  // console.debug('🥕 PROPS: AppTemplate.props.children', children)
  // ** Props.children.props
  // const props2 = children.props
  // console.debug('🥕 PROPS: AppTemplate.props.children.props', props2)

  // ** Hooks
  const auth = useAuth()
  console.debug('%c🔑 auth', ccm.orange, auth)
  // console.debug('%c🔑 auth.user', ccm.orange, auth.user)

  // const { authGuard, guestGuard, acl } = Component // getLayout, setConfig,
  let authGuard = true
  let guestGuard = true
  let acl = {} // aclObjectDefault // admin priveleges by default, currently
  // const authGuard = Component?.authGuard ?? false
  // const guestGuard = Component?.guestGuard ?? false
  // const acl = Component?.acl ?? aclObjectDefault

  // console.debug('%c🥕 PROPS: AppTemplate.props', ccm.orange, props)
  // console.debug('%c🥕 PROPS: AppTemplate.Component', ccm.black, Component)
  // console.debug('%c🥕 PROPS: AppTemplate.pageProps', ccm.black, pageProps)

  // console.debug('%c=======================================', ccm.black)

  // authorized: UserLayout
  if (!auth.loading
    && auth.user != null) {
    // ** USER USER USER
    console.debug('USER USER USER')
    return (
      <UserLayout key='ThreeDAppTemplate-UserLayout'>
        {children}
      </UserLayout>
    )
  }

  // default: BlankLayout
  else if (auth.loading) {
    // ** BLANK BLANK BLANK
    console.debug('LOADING LOADING LOADING')
    // return (
    //   <BlankLayout key='ThreeDAppTemplate-BlankLayout'>
    //     {children}
    //   </BlankLayout>
    // )
  }

  // ** default return
  // ** IMPOSSIBLE IMPOSSIBLE IMPOSSIBLE
  console.debug('ATTEMPT ATTEMPT ATTEMPT')
  // console.debug('BLANK BLANK BLANK')
  // return (
  //   <div id='AppTemplate'>
  //     {/* <h6>YO YO YO</h6> */}
  //     <BlankLayout>
  //       {children}
  //     </BlankLayout>
  //   </div>
  // )
}

export default AppTemplate
