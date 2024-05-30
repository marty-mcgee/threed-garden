// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'
import typography from '#/layout/ui/theme/themes/theme-dark/base/typography'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-dark/functions/pxToRem'

const { white } = colors
const { size, fontWeightBold } = typography

// types
type Types = any

const formControlLabel: Types = {
  styleOverrides: {
    root: {
      display: 'block',
      minHeight: pxToRem(24),
      marginBottom: pxToRem(2),
    },

    label: {
      display: 'inline-block',
      fontSize: size.sm,
      fontWeight: fontWeightBold,
      color: white.main,
      lineHeight: 1,
      transform: `translateY(${pxToRem(1)})`,
      marginLeft: pxToRem(4),

      '&.Mui-disabled': {
        color: white.main,
      },
    },
  },
}

export default formControlLabel
