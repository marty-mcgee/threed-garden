// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme/functions/pxToRem"

// Company Juice Dashboard Base Styles
import colors from "assets/theme/base/colors"
import boxShadows from "assets/theme/base/boxShadows"
import borders from "assets/theme/base/borders"

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
      padding: pxToRem(8),
      borderRadius: borderRadius.md,
    },
  },
}

export default popover
