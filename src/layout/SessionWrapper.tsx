// 'use client'
// 'use server'
// ^^ this file uses server pragma

// ** NEXT AUTH -- SESSION PROVIDER + MIDDLEWARE CONFIG
import { SessionProvider } from 'next-auth/react'
import { auth } from '#/lib/auth/auth'

export default async function SessionWrapper({ children }: { children: any }) {
  // **
  const id: string = 'ThreeDAppSession'

  // get session from next-auth
  const session = await auth()
  console.debug('auth() session', session)
  // set session to static data
  // const session = {
  //   user: {
  //     name: 'string',
  //     email: 'string',
  //     image: 'string',
  //   },
  //   expires: Date.now().toLocaleString() // 'datetime as type date or string?'
  // }
  
  return (
    <SessionProvider session={session}>
      <div
        id={id}
      >
        {children}
      </div>
    </SessionProvider>
  )
}
