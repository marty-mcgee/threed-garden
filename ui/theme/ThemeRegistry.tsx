'use client'
import * as React from 'react'
// ** MUI Themes
// import type { Theme } from '@mui/material/styles'
import { ThemeProvider, createTheme, useTheme, responsiveFontSizes } from '@mui/material/styles' // createTheme (in each theme index)
import CssBaseline from '@mui/material/CssBaseline'
// ** Global Styles
import GlobalStyles from '@mui/material/GlobalStyles'
import GlobalStyling from '#/ui/theme/common/GlobalStyling'
// ** Custom Theme
import NextAppDirEmotionCacheProvider from '#/ui/theme/EmotionCache'
import { MaterialUIControllerProvider, useMaterialUIController, setMiniSidenav, setOpenConfigurator } from '#/lib/contexts'
// import themeConfig from '#/lib/config/themeConfig' // returned as props {settings}
import themeOptions from '#/ui/theme/ThemeOptions'
// import ThemeOptionsUser from '#/ui/theme/ThemeOptionsUser'
// ** Custom themes available for use
// import themeBasic from '#/ui/theme/themes/theme-basic'
// import themeDark from '#/ui/theme/themes/theme-dark'
// import themeLight from '#/ui/theme/themes/theme-light'

export default function ThemeRegistry({ settings, children }: { settings: any, children: React.ReactNode }) {
  // ** set the app theme
  // const activeTheme1 = themeDark // themeBasic | themeDark | themeLight
  // console.debug('THEME: activeTheme1', activeTheme1)
  // console.debug('PROPS: ThemeRegistry.settings == themeConfig', settings)

  // ** Merged ThemeOptions of Core and User
  const coreThemeConfig = themeOptions(settings)
  // console.debug('THEME OPTIONS: as coreThemeConfig:', coreThemeConfig)

  // ** Pass ThemeOptions to CreateTheme Function to create partial theme without component overrides
  const activeTheme = createTheme(coreThemeConfig) // themeDark + settings+options
  // console.debug('THEME: activeTheme2', activeTheme2)
  // const activeTheme = useTheme() // no
  // const activeTheme = activeTheme2

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'threed-mui-emotion' }}>
      <ThemeProvider theme={activeTheme}>
        <MaterialUIControllerProvider>
          <CssBaseline />
          <GlobalStyles styles={() => GlobalStyling(activeTheme, settings)} />
          {children}
        </MaterialUIControllerProvider>
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
