// ThreeD Garden Base Styles
import borders from "~/themes/theme-light/base/borders"
import boxShadows from "~/themes/theme-light/base/boxShadows"

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
