// Company Juice Dashboard Base Styles
import borders from "~/themes/theme-dark/base/borders"

const { borderRadius } = borders

// types
type Types = any

const avatar: Types = {
  styleOverrides: {
    root: {
      transition: "all 200ms ease-in-out",
    },

    rounded: {
      borderRadius: borderRadius.lg,
    },

    img: {
      height: "auto",
    },
  },
}

export default avatar
