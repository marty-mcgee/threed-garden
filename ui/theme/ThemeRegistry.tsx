'use client'
import * as React from 'react'
import NextAppDirEmotionCacheProvider from '#/ui/theme/EmotionCache'

import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
// ** Global Styles
import GlobalStyles from '@mui/material/GlobalStyles'
import GlobalStyling from '#/ui/theme/GlobalStyles'

import themeDefault from '#/ui/theme/themes/theme-default'
import themeDark from '#/ui/theme/themes/theme-dark'
import themeLight from '#/ui/theme/themes/theme-light'

// set the app theme
const theme = themeDark // themeDefault | themeDark | themeLight

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={() => GlobalStyling(theme, settings)} />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
