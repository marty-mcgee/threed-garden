// Company Juice Dashboard Base Styles
import colors from "assets/theme/base/colors"
import borders from "assets/theme/base/borders"
import boxShadows from "assets/theme/base/boxShadows"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme/functions/pxToRem"
import linearGradient from "assets/theme/functions/linearGradient"

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
