// ** React Imports
import { useState, useEffect, ReactNode } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

const WindowWrapper = ({ children }: { children: ReactNode }): JSX.Element => {
  // ** State
  const [windowReadyFlag, setWindowReadyFlag] = useState(false)
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowReadyFlag(true)
    }
  }, [router])
  if (windowReadyFlag) {
    return <>{children}</>
  } else {
    return null
  }
}

export default WindowWrapper
