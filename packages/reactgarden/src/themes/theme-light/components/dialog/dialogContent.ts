// Company Juice Dashboard Base Styles
import typography from "~/themes/theme-light/base/typography"
import borders from "~/themes/theme-light/base/borders"
import colors from "~/themes/theme-light/base/colors"

// Company Juice Dashboard Helper Functions
import pxToRem from "~/themes/theme-light/functions/pxToRem"

const { size } = typography
const { text } = colors
const { borderWidth, borderColor } = borders

// types
type Types = any

const dialogContent: Types = {
  styleOverrides: {
    root: {
      padding: pxToRem(16),
      fontSize: size.md,
      color: text.main,
    },

    dividers: {
      borderTop: `${borderWidth[1]} solid ${borderColor}`,
      borderBottom: `${borderWidth[1]} solid ${borderColor}`,
    },
  },
}

export default dialogContent
