// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-light/base/colors"
import boxShadows from "~/themes/theme-light/base/boxShadows"
import borders from "~/themes/theme-light/base/borders"

const { white } = colors
const { md } = boxShadows
const { borderRadius } = borders

// types
type Types = any

const tableContainer: Types = {
  styleOverrides: {
    root: {
      backgroundColor: white.main,
      boxShadow: md,
      borderRadius: borderRadius.xl,
    },
  },
}

export default tableContainer
