// ==============================================================
// RESOURCES
// ** DEFAULT APP LAYOUT TEMPLATE
// template.tsx -- for Next.js 13

'use client'

// React
import type { ReactNode } from 'react'

// ** Layout + Metadata Components
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your main layout

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {template.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP TEMPLATE

const AppTemplate = ({ children }: { children: ReactNode }): JSX.Element => {
  // const { children } = props

  return (
    <div id='AppTemplate'>
      {/* <h6>YO YO YO</h6> */}
      <BlankLayout>
        {children}
      </BlankLayout>
    </div>
  )
}

export default AppTemplate
