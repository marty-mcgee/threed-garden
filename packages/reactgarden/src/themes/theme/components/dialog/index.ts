// Company Juice Dashboard Base Styles
import borders from "assets/theme/base/borders"
import boxShadows from "assets/theme/base/boxShadows"

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
