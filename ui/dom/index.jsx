// 'use client'

import { setState } from '#/lib/threed/stores/store'
import { useEffect, useRef } from 'react'

const ObjectStateReference = ({ children }) => {
  // ** HEY HEY HEY
  console.debug('OBJECT STATE REFERENCE (dom/wrapper useRef)')
  const ref = useRef(null)
  useEffect(() => {
    setState({ dom: ref })
  }, [])

  return (
    <div className='dom' ref={ref}>
      {children}
    </div>
  )
}

export default ObjectStateReference
