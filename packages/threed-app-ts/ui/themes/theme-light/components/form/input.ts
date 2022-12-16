// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-light/base/colors'
import typography from '#/ui/themes/theme-light/base/typography'
import borders from '#/ui/themes/theme-light/base/borders'

const { info, inputBorderColor, dark } = colors
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
        borderBottom: `${borderWidth[1]} solid ${inputBorderColor}`,
      },

      '&:before': {
        borderColor: inputBorderColor,
      },

      '&:after': {
        borderColor: info.main,
      },
    },
  },
}

export default input
