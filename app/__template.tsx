// ==============================================================
// RESOURCES
// ** DEFAULT APP TEMPLATE -- LAYOUT WRAPPER
// template.tsx -- for Next.js 13
// ?? FOR ENTIRE APP CONTEXTS ??

'use client'

// ** React
import type { ReactNode } from 'react'

// ** User Authorization Hook *** [MM] CUSTOM CODE HOOK
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Layout + Metadata Components
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your main layout

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {template.tsx}', ccm.green)
// console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP TEMPLATE

const AppTemplate = ({ children }: { children: ReactNode }): JSX.Element => {

  // console.debug('%c🥕 PROPS: AppTemplate', ccm.orange, children)

  // ** Hooks
  const auth = useAuth()
  console.debug('%c🔑 auth', ccm.orange, auth)
  // console.debug('%c🔑 auth.user', ccm.orange, auth.user)

  // authorized: UserLayout
  if (auth.user != null) { // !auth.loading &&
    // ** USER USER USER
    console.debug('AUTHORIZED USER USER USER')
    return (
      <UserLayout key='ThreeDAppTemplate-UserLayout'>
        {children}
      </UserLayout>
    )
  }

  // LOADING...
  // else if (auth.loading) {
  //   console.debug('LOADING LOADING LOADING')
  //   return <Spinner />
  // }

  // ** default return BLANK
  console.debug('BLANK BLANK BLANK')
  return (
    <BlankLayout key='ThreeDAppTemplate-BlankLayout'>
      {children}
    </BlankLayout>
  )
}

export default AppTemplate
