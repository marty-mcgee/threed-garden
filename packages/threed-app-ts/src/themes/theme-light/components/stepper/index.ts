// ThreeD Garden Base Styles
import colors from "~/themes/theme-light/base/colors"
import borders from "~/themes/theme-light/base/borders"
import boxShadows from "~/themes/theme-light/base/boxShadows"

// ThreeD Garden Helper Functions
import pxToRem from "~/themes/theme-light/functions/pxToRem"
import linearGradient from "~/themes/theme-light/functions/linearGradient"

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
