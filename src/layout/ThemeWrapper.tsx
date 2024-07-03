// 'use client'
'use server'
// ^^ does this file require client or server pragma ???

// ** REACT Imports
import type { ReactNode } from 'react'

// LAYOUT PROVIDERRRRRR by RADIX-UI
// ** RADIX-UI Imports
import { 
  Theme, 
  ThemePanel, 
  Container,
  Grid,
  Flex,
  Box,
} from '@radix-ui/themes'
// ** NEXT THEMES Imports
import { ThemeProvider } from 'next-themes'

// for client components only
// import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ThemeViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const ThemeWrapper = ({ children }: { children: ReactNode}) => {
  // **
  const _id: string = 'ThreeDAppThemeWrapper'
  // const ref: any = useRef<any>() // for client components only
  
  return (
    <ThemeProvider // next-themes (not radix-ui, but radix-ui supports next-themes)
      attribute='class' // uses next-themes [ light | dark ] browser setting
    >
      <Theme 
        appearance='dark' // inherit | light | dark ... overrides next-themes attribute
        accentColor='grass' // gray | grass | green | crimson | ... many choices
        grayColor='sand' // sand | olive | sage | slate | ... many choices
        radius='none' // none | small | medium | large | full
        scaling='90%' // 90 | 95 | 100 | 105 | 110
      >
        <Flex
          id='ThreeDAppThemeBody'
          key={_id}
          // ref={ref} // for client components only
          direction={'column'}
        >
          {children}
        </Flex>

        <ThemePanel
          defaultOpen={false} // true | false // public property :)
          // open={true} // true | false // private property :(
        />

      </Theme>
    </ThemeProvider>
  )
}

export default ThemeWrapper
