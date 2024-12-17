'use client'
// 'use server'
// ^^ this file uses client pragma

// ** NEXT AUTH -- SESSION PROVIDER + MIDDLEWARE CONFIG
import { SessionProvider } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'

// ** EXPORT function -- async?
export default function SessionWrapper({ children }: { children: any }) {
  // **
  const id_random: string = 'ThreeDAppSession'

  // ** CLIENT : HOOKS
  // const { isLoaded, userId, sessionId, getToken } = useAuth()
  // console.debug('threed clerk hooks :', isLoaded, userId, sessionId)

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
    <SessionProvider 
      session={sessionThreeD}
    >
      {children}
    </SessionProvider>
  )
}
