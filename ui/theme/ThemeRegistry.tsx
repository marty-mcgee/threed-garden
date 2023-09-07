'use client'
import * as React from 'react'
import NextAppDirEmotionCacheProvider from '#/ui/theme/EmotionCache'

// ** MUI Themes
import type { Theme, ThreedTheme } from '@mui/material/styles' // need this here ??
import { ThemeProvider, createTheme, useTheme, responsiveFontSizes } from '@mui/material/styles' // createTheme (in each theme index)
import CssBaseline from '@mui/material/CssBaseline'
// ** Global Styles
import GlobalStyles from '@mui/material/GlobalStyles'
import GlobalStyling from '#/ui/theme/common/GlobalStyling'
// ** Custom Theme
// import themeConfig from '#/lib/config/themeConfig' // returned as prop {settings}
import themeOptions from '#/ui/theme/ThemeOptions'
// import ThemeOptionsUser from '#/ui/theme/ThemeOptionsUser'
// ** Custom themes available for use
import themeBasic from '#/ui/theme/themes/theme-basic'
import themeDark from '#/ui/theme/themes/theme-dark'
import themeLight from '#/ui/theme/themes/theme-light'

// ** set the app theme
const theTheme = themeDark // themeBasic | themeDark | themeLight

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }, theTheme: Theme) {
  // **
  console.debug('THEME: theTheme', useTheme())
  console.debug('PROPS: ThemeRegistry.settings == themeConfig', settings)
  // ** Props
  // const { settings, children } = props

  // ** Merged ThemeOptions of Core and User
  const coreThemeConfig = themeOptions(settings)
  console.debug('THEME OPTIONS: as coreThemeConfig:', coreThemeConfig)

  // ** Pass ThemeOptions to CreateTheme Function to create partial theme without component overrides
  // let theTheme = createTheme(coreThemeConfig) // themeDark, settings+options
  // let theTheme = useTheme()

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'threed-mui-emotion' }}>
      <ThemeProvider theme={useTheme()}>
        <CssBaseline />
        <GlobalStyles styles={() => GlobalStyling(useTheme(), settings)} />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
