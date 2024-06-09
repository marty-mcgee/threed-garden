'use client'

/*
Tip: A single route can effectively contain both a layout and a template, with the layout serving as an outer shell that encases the template within it. https://www.builder.io/blog/nextjs-14-layouts-templates
*/

import { useEffect } from 'react'

const RootTemplate = ({children}: {children: React.ReactNode}) => {
  // **
  console.debug('RootTemplate loading...')
  useEffect(() => {
    console.debug('RootTemplate loaded.')
  }, [])
  // **
  return (
    <>
      {children}
    </>
  )
}

export default RootTemplate