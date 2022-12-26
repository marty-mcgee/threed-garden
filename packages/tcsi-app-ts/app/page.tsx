// ==============================================================
// Index Page (Forwarding Page)

'use client'

// ** Next Imports
import type { NextPage } from 'next'
// import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ** React Imports
// import type { ReactNode } from 'react'
import { useEffect } from 'react'

// ** Hook Imports
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Demo Data Imports
// import { demos } from '#/lib/data/demos'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
import type { TPageProps } from '#/lib/types/TAppProps'

// ==============================================================
// IMPORTS COMPLETE
console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 tCSi<T>: {page.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

// ==============================================================

// Set Home Forwarding (to First Page) URL, based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') {
    // return '/home' // another page
    return '/participate' // another page
    return '/acl' // authorized credentials list? (boundary)
  }
  else if (role === 'admin') {
    // return '/' // this page (for testing. not ideal for production.)
    return '/home' // another page
    return '/participate' // another page
  }
  else {
    // return '/' // this page (for testing. not ideal for production.)
    return '/auth/login'
  }
}

// ==============================================================

// export default function Page<NextPage>() {
const AppPage: NextPage<TPageProps> = (): JSX.Element => {
  // **
  console.debug('%c🥕 AppPage', ccm.green)

  // ** Hooks
  const auth = useAuth()
  const router = useRouter()

  // ** OnMount (+ optional return OnUnmount)
  useEffect(() => {
    // user AUTHORIZED?
    if (auth.user && auth.user.role) {
      // get Home URL
      const homeRoute = getHomeRoute(auth.user.role)
      console.debug('✅ user AUTHORIZED', auth.user, homeRoute)
      // redirect user to Home URL
      router.replace(homeRoute)
    }
    // user NOT AUTHORIZED!
    else {
      const homeRoute = getHomeRoute('unauthorized')
      console.debug('❌ user NOT AUTHORIZED', auth.user, homeRoute)
      // redirect user to Home URL
      router.replace(homeRoute)
    }
    // return <></>
  }, [])

// ==============================================================

  // ** Return JSX
  return <Spinner />
}

export default AppPage
