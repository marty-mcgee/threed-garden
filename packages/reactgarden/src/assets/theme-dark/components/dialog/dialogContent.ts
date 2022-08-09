// Company Juice Dashboard Base Styles
import typography from "assets/theme-dark/base/typography"
import borders from "assets/theme-dark/base/borders"
import colors from "assets/theme-dark/base/colors"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme-dark/functions/pxToRem"
import rgba from "assets/theme-dark/functions/rgba"

const { size } = typography
const { white } = colors
const { borderWidth, borderColor } = borders

// types
type Types = any

const dialogContent: Types = {
  styleOverrides: {
    root: {
      padding: pxToRem(16),
      fontSize: size.md,
      color: rgba(white.main, 0.8),
    },

    dividers: {
      borderTop: `${borderWidth[1]} solid ${rgba(borderColor, 0.6)}`,
      borderBottom: `${borderWidth[1]} solid ${rgba(borderColor, 0.6)}`,
    },
  },
}

export default dialogContent
