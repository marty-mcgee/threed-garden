// Company Juice Dashboard Base Styles
import colors from "themes/theme-dark/base/colors"
import typography from "themes/theme-dark/base/typography"

// Company Juice Dashboard Helper Functions
import pxToRem from "themes/theme-dark/functions/pxToRem"

const { white } = colors
const { size, fontWeightBold } = typography

// types
type Types = any

const formControlLabel: Types = {
  styleOverrides: {
    root: {
      display: "block",
      minHeight: pxToRem(24),
      marginBottom: pxToRem(2),
    },

    label: {
      display: "inline-block",
      fontSize: size.sm,
      fontWeight: fontWeightBold,
      color: white.main,
      lineHeight: 1,
      transform: `translateY(${pxToRem(1)})`,
      marginLeft: pxToRem(4),

      "&.Mui-disabled": {
        color: white.main,
      },
    },
  },
}

export default formControlLabel
