// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'
import typography from '#/layout/ui/theme/themes/theme-dark/base/typography'
import borders from '#/layout/ui/theme/themes/theme-dark/base/borders'

// ThreeD Garden Helper Functions
import rgba from '#/layout/ui/theme/themes/theme-dark/functions/rgba'

const { info, inputBorderColor, dark, grey, white } = colors
const { size } = typography
const { borderWidth } = borders

// types
type Types = any

const input: Types = {
  styleOverrides: {
    root: {
      fontSize: size.sm,
      color: dark.main,

      '&:hover:not(.Mui-disabled):before': {
        borderBottom: `${borderWidth[1]} solid ${rgba(inputBorderColor, 0.6)}`,
      },

      '&:before': {
        borderColor: rgba(inputBorderColor, 0.6),
      },

      '&:after': {
        borderColor: info.main,
      },

      input: {
        color: white.main,

        '&::-webkit-input-placeholder': {
          color: grey[100],
        },
      },
    },
  },
}

export default input
