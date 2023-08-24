// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-dark/base/colors'
import borders from '#/ui/themes/theme-dark/base/borders'
import boxShadows from '#/ui/themes/theme-dark/base/boxShadows'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-dark/functions/pxToRem'
import linearGradient from '#/ui/themes/theme-dark/functions/linearGradient'

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

      '&.MuiPaper-root': {
        backgroundColor: transparent.main,
      },
    },
  },
}

export default stepper
