'use client'
// 'use server'
// ^^ this file uses client pragma


// ** NEXT AUTH -- SESSION PROVIDER + MIDDLEWARE CONFIG
import { SessionProvider } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'

// ** CLERK AUTH -- External User Authentication
// import { ClerkProvider } from '@clerk/nextjs'
// ** CLERK AUTH -- HOOKS
import { useAuth } from '@clerk/nextjs'

// export function ClerkHookExample() {
//   const { isLoaded, userId, sessionId, getToken } = useAuth()

//   // In case the user signs out while on the page.
//   if (!isLoaded || !userId) {
//     return null
//   }

//   return (
//     <div>
//       Hello, {userId} your current active session is {sessionId}
//     </div>
//   )
// }

// ** EXPORT function -- async?
export default function SessionWrapper({ children }: { children: any }) {
  // **
  const id_random: string = 'ThreeDAppSession'

  // ** CLIENT : HOOKS
  const { isLoaded, userId, sessionId, getToken } = useAuth()

  // ** SERVER : get session from next-auth
  // const session = await auth()
  // console.debug('auth() session', session)

  // ** CLIENT : THREED : set session to static data
  let sessionThreeD = {
    user: {
      name: 'string',
      email: 'string',
      image: 'string',
    },
    expires: Date.now().toLocaleString() // 'datetime as type date or string?'
  }
  
  return (
    <>
    {/* <ClerkProvider> */}
      <SessionProvider 
        session={sessionThreeD}
      >
        {children}
      </SessionProvider>
    {/* </ClerkProvider> */}
    </>
  )
}
