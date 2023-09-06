'use client'
import * as React from 'react'
import NextAppDirEmotionCacheProvider from './EmotionCache'

import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import themeDefault from '#/ui/theme/themes/theme-default'
import themeDark from '#/ui/theme/themes/theme-dark'
import themeLight from '#/ui/theme/themes/theme-light'

// set the app theme
const theme = themeDefault // themeDefault | themeDark | themeLight

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme} settings={settings}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
