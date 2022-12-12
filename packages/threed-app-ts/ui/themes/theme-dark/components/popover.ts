// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-dark/base/colors'
import boxShadows from '~/ui/themes/theme-dark/base/boxShadows'
import borders from '~/ui/themes/theme-dark/base/borders'

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
