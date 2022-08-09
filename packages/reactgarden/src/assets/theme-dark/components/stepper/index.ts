// Company Juice Dashboard Base Styles
import colors from "assets/theme-dark/base/colors"
import borders from "assets/theme-dark/base/borders"
import boxShadows from "assets/theme-dark/base/boxShadows"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme-dark/functions/pxToRem"
import linearGradient from "assets/theme-dark/functions/linearGradient"

const { transparent, gradients } = colors
const { borderRadius } = borders
const { colored } = boxShadows

// types
type Types = any

const stepper: Types = {
  styleOverrides: {
    root: {
      background: linearGradient(gradients.info.main, gradients.info.state),
      padding: `${pxToRem(24)} 0 ${pxToRem(16)}`,
      borderRadius: borderRadius.lg,
      boxShadow: colored.info,

      "&.MuiPaper-root": {
        backgroundColor: transparent.main,
      },
    },
  },
}

export default stepper
