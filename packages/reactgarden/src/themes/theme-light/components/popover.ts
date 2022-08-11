// Company Juice Dashboard Helper Functions
import pxToRem from "themes/theme-light/functions/pxToRem"

// Company Juice Dashboard Base Styles
import colors from "themes/theme-light/base/colors"
import boxShadows from "themes/theme-light/base/boxShadows"
import borders from "themes/theme-light/base/borders"

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
