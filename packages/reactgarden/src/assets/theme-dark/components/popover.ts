// Company Juice Dashboard Base Styles
import colors from "assets/theme-dark/base/colors"
import boxShadows from "assets/theme-dark/base/boxShadows"
import borders from "assets/theme-dark/base/borders"

const { transparent } = colors
const { lg } = boxShadows
const { borderRadius } = borders

// types
type Types = any

const popover: Types = {
  styleOverrides: {
    paper: {
      backgroundColor: transparent.main,
      boxShadow: lg,
      borderRadius: borderRadius.md,
    },
  },
}

export default popover
