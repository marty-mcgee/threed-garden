'use client'
import * as React from 'react'
import NextAppDirEmotionCacheProvider from '#/ui/theme/EmotionCache'

import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
// ** Global Styles
import GlobalStyles from '@mui/material/GlobalStyles'
import GlobalStyling from '#/ui/theme/GlobalStyles'

// ** Theme
import themeConfig from '#/lib/config/themeConfig'
import themeOptions from './ThemeOptions'
import UserThemeOptions from '#/ui/theme/UserThemeOptions'
// ** themes available for use
import themeDefault from '#/ui/theme/themes/theme-default'
import themeDark from '#/ui/theme/themes/theme-dark'
import themeLight from '#/ui/theme/themes/theme-light'
// ** set the app theme
const theme = themeDark // themeDefault | themeDark | themeLight

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }) {
  // ** Props
  // const { settings, children } = props

  // ** Merged ThemeOptions of Core and User
  const coreThemeConfig = themeOptions(settings)
  // console.debug('coreThemeConfig:', coreThemeConfig)

  // ** Pass ThemeOptions to CreateTheme Function to create partial theme without component overrides
  let theme = createTheme(coreThemeConfig)

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'threed-mui-emotion' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={() => GlobalStyling(theme, settings)} />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
