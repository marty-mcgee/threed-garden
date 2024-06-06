// 'use client'

// SESSSSSSION PROVIDERRRRRR
import { SessionProvider } from 'next-auth/react'
import { auth } from '#/lib/auth/auth' // this goes in page?

// import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const LayoutWrapper = async ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  // const ref: any = useRef<any>()

  // this goes in page?
  let session = await auth()
  console.debug('auth() session', session)
  // const session = async () => await auth()
  // console.debug('session', session())

  // let session = {
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

export { LayoutWrapper }
export default LayoutWrapper
