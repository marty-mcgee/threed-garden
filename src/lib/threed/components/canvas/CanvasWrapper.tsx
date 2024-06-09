'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
const ExperienceViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const CanvasWrapper = ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  const ref: any = useRef<any>()

  return (
    <group
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
      <ExperienceViewer
        // style={{
        //   position: 'fixed',
        //   top: 0,
        //   left: 0,
        //   width: '100vw',
        //   height: '100vh',
        //   pointerEvents: 'none',
        // }}
        // @ts-expect-error
        eventSource={ref}
        eventPrefix='client'
      />
    </group>
  )
}

export { CanvasWrapper }
export default CanvasWrapper
