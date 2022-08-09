// Company Juice Dashboard Base Styles
import colors from "assets/theme-dark/base/colors"
import typography from "assets/theme-dark/base/typography"
import borders from "assets/theme-dark/base/borders"

// Company Juice Dashboard Helper Functions
import rgba from "assets/theme-dark/functions/rgba"

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

      "&:hover:not(.Mui-disabled):before": {
        borderBottom: `${borderWidth[1]} solid ${rgba(inputBorderColor, 0.6)}`,
      },

      "&:before": {
        borderColor: rgba(inputBorderColor, 0.6),
      },

      "&:after": {
        borderColor: info.main,
      },

      input: {
        color: white.main,

        "&::-webkit-input-placeholder": {
          color: grey[100],
        },
      },
    },
  },
}

export default input
