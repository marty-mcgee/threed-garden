// Company Juice Dashboard Base Styles
import colors from "themes/theme-dark/base/colors"
import borders from "themes/theme-dark/base/borders"

// Company Juice Dashboard Helper Functions
import pxToRem from "themes/theme-dark/functions/pxToRem"

const { background } = colors
const { borderRadius } = borders

// types
type Types = any

const sidenav: Types = {
  styleOverrides: {
    root: {
      width: pxToRem(250),
      whiteSpace: "nowrap",
      border: "none",
    },

    paper: {
      width: pxToRem(250),
      backgroundColor: background.sidenav,
      height: `calc(100vh - ${pxToRem(32)})`,
      margin: pxToRem(16),
      borderRadius: borderRadius.xl,
      border: "none",
    },

    paperAnchorDockedLeft: {
      borderRight: "none",
    },
  },
}

export default sidenav
