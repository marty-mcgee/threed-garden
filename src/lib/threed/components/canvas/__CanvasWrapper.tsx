'use client'

// ** React
import type { ReactNode } from 'react'

import { useRef } from 'react'

const CanvasWrapper = ({ children }: { children: ReactNode}) => {
  const id: string = 'HEY HEY HEY'
  const ref: any = useRef<any>()

  return (
    <div
      key={id}
      ref={ref}
    >
      {children}
    </div>
  )
}

export { CanvasWrapper }
export default CanvasWrapper
