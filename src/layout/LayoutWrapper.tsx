'use client'

// SESSSSSSION PROVIDERRRRRR
import { SessionProvider } from 'next-auth/react'
// import { auth } from 'auth' // this goes in page

import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const LayoutWrapper = ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  const ref: any = useRef<any>()

  // this goes in page?
  // const session = async () => await auth()
  // console.debug('session', session())

  let session = {
    user: {
      name: 'string',
      email: 'string',
      image: 'string',
    },
    expires: Date.now().toLocaleString() // 'datetime as type date or string?'
  }
  
  return (
    <SessionProvider session={session}>
      <div
        id='ThreeDAppSession'
        key={id}
        ref={ref}
      >
        {children}
      </div>
    </SessionProvider>
  )
}

export { LayoutWrapper }
export default LayoutWrapper
