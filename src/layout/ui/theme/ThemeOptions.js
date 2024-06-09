// ** MUI Theme Provider
import { deepmerge } from '@mui/utils'

// ** User Theme Options
// import ThemeOptionsUser from '#/layout/ui/theme/ThemeOptionsUser'

// ** Theme Override Imports
import palette from '#/layout/ui/theme/common/palette'
import spacing from '#/layout/ui/theme/common/spacing'
import shadows from '#/layout/ui/theme/common/shadows'
import breakpoints from '#/layout/ui/theme/common/breakpoints'

const themeOptions = (settings) => {
  // ** Vars
  const { skin, mode, direction, themeColor } = settings
  // ** DEBUG
  // console.debug('settings', settings)
  // console.debug('settings.skin', skin)
  // console.debug('settings.mode', mode)
  // console.debug('settings.direction', direction)
  // console.debug('settings.themeColor', themeColor)

  // return settings


  // // ** User Theme Options ??
  // // ** Create New object before removing user component overrides and typography objects from ThemeOptionsUser
  // const userThemeConfig = Object.assign({}, ThemeOptionsUser())
  // const userFontFamily = userThemeConfig.typography?.fontFamily

  // // ** Remove component overrides and typography objects from ThemeOptionsUser
  // delete userThemeConfig.components
  // delete userThemeConfig.typography

  const mergedThemeConfig = deepmerge(
    {
      direction,
      palette: palette(mode, skin, themeColor),
      typography: {
        fontFamily:
          // userFontFamily ||
          [
            'Inter',
            'sans-serif',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(','),
      },
      // shadows: shadows(mode),
      ...spacing,
      breakpoints: breakpoints(),
      shape: {
        borderRadius: 6,
      },
      mixins: {
        toolbar: {
          minHeight: 64,
        },
      },
      // ?? missing requirements to pass TS
      // boxShadows: {},
      // borders: {},
      // functions: {},
    },
    // userThemeConfig
  )

  return deepmerge(mergedThemeConfig, {
    palette: {
      primary: {
        ...mergedThemeConfig.palette[themeColor],
      },
    },
  })
  // return mergedThemeConfig
}

export default themeOptions
