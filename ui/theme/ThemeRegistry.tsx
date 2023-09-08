'use client'
import * as React from 'react'
import NextAppDirEmotionCacheProvider from '#/ui/theme/EmotionCache'

// ** MUI Themes
// import type { Theme } from '@mui/material/styles'
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

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }) {
  // ** set the app theme
  let activeTheme = themeDark // themeBasic | themeDark | themeLight
  // **
  console.debug('THEME: activeTheme', activeTheme)
  console.debug('PROPS: ThemeRegistry.settings == themeConfig', settings)

  // ** Merged ThemeOptions of Core and User
  const coreThemeConfig = themeOptions(settings)
  console.debug('THEME OPTIONS: as coreThemeConfig:', coreThemeConfig)

  // ** Pass ThemeOptions to CreateTheme Function to create partial theme without component overrides
  // activeTheme = createTheme(coreThemeConfig) // themeDark, settings+options
  activeTheme = useTheme()

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'threed-mui-emotion' }}>
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        <GlobalStyles styles={() => GlobalStyling(activeTheme, settings)} />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
