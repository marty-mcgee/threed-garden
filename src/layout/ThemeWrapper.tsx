// 'use client'
'use server'

// LAYOUT PROVIDERRRRRR by RADIX-UI
import { 
  Theme, 
  ThemePanel, 
  Container,
  Grid,
  Box,
} from '@radix-ui/themes'
import { ThemeProvider } from 'next-themes'

// import { useRef } from 'react'
// import dynamic from 'next/dynamic'
// const ThemeViewer = dynamic(() => import('#/lib/threed/components/canvas/ExperienceViewer'), { ssr: false })

const ThemeWrapper = async ({ children }: { children: any}) => {
  // **
  const id: string = 'ThreeDAppTheme'
  // const ref: any = useRef<any>()

  // get session from next-auth
  // const session = await auth()
  // console.debug('auth() session', session)
  // // const session = async () => await auth()
  // // console.debug('auth() session', session())
  // set session to static data
  // const session = {
  //   user: {
  //     name: 'string',
  //     email: 'string',
  //     image: 'string',
  //   },
  //   expires: Date.now().toLocaleString() // 'datetime as type date or string?'
  // }
  
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
        <Container
          id='ThreeDAppThemeBody'
          key={id}
          // ref={ref}
          // size='4'
          width={'100%'}
          maxWidth={'100%'}
        >
          {children}
        </Container>  

        {/* <ThemePanel
          // open={true} // true | false // private property, sorry
        /> */}

      </Theme>
    </ThemeProvider>
  )
}

export default ThemeWrapper
