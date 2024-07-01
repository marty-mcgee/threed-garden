// 'use client'
'use server'
// ^^ this file requires server pragma

// ** React
import type { ReactNode } from 'react'

// SESSSSSSION PROVIDERRRRRR
import { SessionProvider } from 'next-auth/react'
import { auth } from '#/lib/auth/auth' // this goes in page?

// import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const SessionWrapper = async ({ children }: { children: ReactNode}) => {
  // **
  const id: string = 'ThreeDAppSession'
  // const ref: any = useRef<any>()

  // get session from next-auth
  const session = await auth()
  // console.debug('auth() session', session)
  // // const session = async () => await auth()
  // // console.debug('auth() session', session())
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
        id='ThreeDAppSession'
        key={id}
        // ref={ref}
      >
        {children}
      </div>
    </SessionProvider>
  )
}

export default SessionWrapper
