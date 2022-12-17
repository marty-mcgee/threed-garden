// ==============================================================
// Index Page (Forwarding Page)

'use client'

// ** Next Imports
import type { NextPage } from 'next'
// import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ** React Imports
import { useEffect } from 'react'

// ** Hook Imports
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Demo Data Imports
// import { demos } from '#/lib/data/demos'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ==============================================================

// Set Home Forwarding (to First Page) URL, based on User Role
const getHomeRoute = (role: any) => {
  if (role === 'client') {
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
    return '/login'
  }
}

// ==============================================================

export default function Page<NextPage>() {
  // const Page = (props) => {
  //
  // ** Hooks
  const auth = useAuth()
  const router = useRouter()

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
  }, [])

  return <Spinner />

  // return (
  //   <div className="space-y-8">
  //     <h1 className="text-xl font-medium text-gray-300">
  //       HEY HEY HEY
  //     </h1>
  //     <div className="space-y-10 text-white">
  //       {demos.map((section) => {
  //         return (
  //           <div key={section.name} className="space-y-5">
  //             <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
  //               {section.name}
  //             </div>
  //             <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
  //               {section.items.map((item) => {
  //                 return (
  //                   <Link
  //                     href={`/${item.slug}`}
  //                     key={item.name}
  //                     className="group block space-y-1.5 rounded-lg bg-gray-900 px-5 py-3 hover:bg-gray-800"
  //                   >
  //                     <div className="font-medium text-gray-200 group-hover:text-gray-50">
  //                       {item.name}
  //                     </div>

  //                     {item.description ? (
  //                       <div className="line-clamp-3 text-sm text-gray-400 group-hover:text-gray-300">
  //                         {item.description}
  //                       </div>
  //                     ) : null}
  //                   </Link>
  //                 );
  //               })}
  //             </div>
  //           </div>
  //         );
  //       })}
  //     </div>
  //   </div>
  // )
}
