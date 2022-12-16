// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-light/functions/pxToRem'

// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-light/base/colors'
import boxShadows from '#/ui/themes/theme-light/base/boxShadows'
import borders from '#/ui/themes/theme-light/base/borders'

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
