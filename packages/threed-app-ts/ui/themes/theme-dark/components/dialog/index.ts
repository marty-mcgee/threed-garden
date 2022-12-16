// ThreeD Garden Base Styles
import borders from '#/ui/themes/theme-dark/base/borders'
import boxShadows from '#/ui/themes/theme-dark/base/boxShadows'

const { borderRadius } = borders
const { xxl } = boxShadows

// types
type Types = any

const dialog: Types = {
  styleOverrides: {
    paper: {
      borderRadius: borderRadius.lg,
      boxShadow: xxl,
    },

    paperFullScreen: {
      borderRadius: 0,
    },
  },
}

export default dialog
