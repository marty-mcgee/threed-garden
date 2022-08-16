// Company Juice Dashboard Base Styles
import typography from "~/themes/theme-dark/base/typography"
import colors from "~/themes/theme-dark/base/colors"

// Company Juice Dashboard Helper Functions
import rgba from "~/themes/theme-dark/functions/rgba"

const { size } = typography
const { white } = colors

// types
type Types = any

const dialogContentText: Types = {
  styleOverrides: {
    root: {
      fontSize: size.md,
      color: rgba(white.main, 0.8),
    },
  },
}

export default dialogContentText
