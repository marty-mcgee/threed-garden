// Company Juice Dashboard Base Styles
import colors from "assets/theme/base/colors"

const { transparent } = colors

// types
type Types = any

const iconButton: Types = {
  styleOverrides: {
    root: {
      "&:hover": {
        backgroundColor: transparent.main,
      },
    },
  },
}

export default iconButton
