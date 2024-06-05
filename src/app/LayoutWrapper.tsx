'use client'

import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const LayoutWrapper = ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  const ref: any = useRef<any>()

  return (
    <div
      key={id}
      ref={ref}
      // style={{
      //   position:     'relative',
      //   width:        '100%',
      //   height:       '100%',
      //   overflow:     'auto',
      //   touchAction:  'auto',
      // }}
    >
      {children}
    </div>
  )
}

export { LayoutWrapper }
export default LayoutWrapper
