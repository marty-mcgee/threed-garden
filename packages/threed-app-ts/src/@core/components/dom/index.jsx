import { setState } from '~/components/threed/stores/store'
import { useEffect, useRef } from 'react'

const Dom = ({ children }) => {
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

export default Dom
