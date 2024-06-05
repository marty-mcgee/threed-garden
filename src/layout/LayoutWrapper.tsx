'use client'

// SESSSSSSION PROVIDERRRRRR
import { SessionProvider } from 'next-auth/react'

import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const LayoutWrapper = ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  const ref: any = useRef<any>()

  return (
    <SessionProvider session={null}>
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
