// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-light/base/colors'
import typography from '#/layout/ui/theme/themes/theme-light/base/typography'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-light/functions/pxToRem'

const { dark } = colors
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
      color: dark.main,
      lineHeight: 1,
      transform: `translateY(${pxToRem(1)})`,
      marginLeft: pxToRem(4),

      '&.Mui-disabled': {
        color: dark.main,
      },
    },
  },
}

export default formControlLabel
