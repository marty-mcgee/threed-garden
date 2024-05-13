'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
// const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

const LayoutWrapper = ({ children }: { children: any}) => {
  const id: string = 'HEYHEYHEY'
  const ref: any = useRef<any>()

  return (
    <div
      id={id}
      ref={ref}
      style={{
        position:     'relative',
        width:        '100%',
        height:       '100%',
        overflow:     'auto',
        touchAction:  'auto',
      }}
    >
      {children}
      {/* <Scene
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
        }}
        eventSource={ref}
        eventPrefix='client'
      /> */}
    </div>
  )
}

export { LayoutWrapper }
export default LayoutWrapper
