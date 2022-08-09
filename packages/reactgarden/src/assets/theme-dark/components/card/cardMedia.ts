// Company Juice Dashboard Base Styles
import borders from "assets/theme-dark/base/borders"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme-dark/functions/pxToRem"

const { borderRadius } = borders

// types
type Types = any

const cardMedia: Types = {
  styleOverrides: {
    root: {
      borderRadius: borderRadius.xl,
      margin: `${pxToRem(16)} ${pxToRem(16)} 0`,
    },

    media: {
      width: "auto",
    },
  },
}

export default cardMedia
