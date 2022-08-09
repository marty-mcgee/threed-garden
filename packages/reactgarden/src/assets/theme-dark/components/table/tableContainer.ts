// Company Juice Dashboard Base Styles
import colors from "assets/theme-dark/base/colors"
import boxShadows from "assets/theme-dark/base/boxShadows"
import borders from "assets/theme-dark/base/borders"

const { background } = colors
const { md } = boxShadows
const { borderRadius } = borders

// types
type Types = any

const tableContainer: Types = {
  styleOverrides: {
    root: {
      backgroundColor: background.card,
      boxShadow: md,
      borderRadius: borderRadius.xl,
    },
  },
}

export default tableContainer
