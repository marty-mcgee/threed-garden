// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-dark/base/colors"

const { text } = colors

// types
type Types = any

const formLabel: Types = {
  styleOverrides: {
    root: {
      color: text.main,
    },
  },
}

export default formLabel
