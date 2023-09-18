// ThreeD Garden Base Styles
import typography from '#/ui/theme/themes/theme-dark/base/typography'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/theme/themes/theme-dark/functions/pxToRem'

const { size } = typography

// types
type Types = any

const dialogTitle: Types = {
  styleOverrides: {
    root: {
      padding: pxToRem(16),
      fontSize: size.xl,
    },
  },
}

export default dialogTitle
