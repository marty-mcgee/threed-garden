// 'use client'
'use server'

// LAYOUT PROVIDERRRRRR by RADIX-UI
import { 
  Theme, 
  ThemePanel, 
  Container,
  Grid,
  Flex,
  Box,
} from '@radix-ui/themes'
import { ThemeProvider } from 'next-themes'

// for client components only
// import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ThemeViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const ThemeWrapper = ({ children }: { children: any}) => {
  // **
  const _id: string = 'ThreeDAppTheme'
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
          // open={true} // true | false // private property, sorry
        />

      </Theme>
    </ThemeProvider>
  )
}

export default ThemeWrapper
