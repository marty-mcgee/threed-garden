// ThreeD Garden Base Styles
import colors from "~/themes/theme-dark/base/colors"
import borders from "~/themes/theme-dark/base/borders"
import typography from "~/themes/theme-dark/base/typography"

// ThreeD Garden Helper Functions
import pxToRem from "~/themes/theme-dark/functions/pxToRem"
import rgba from "~/themes/theme-dark/functions/rgba"

const { dark, white } = colors
const { borderRadius } = borders
const { size } = typography

// types
type Types = any

const menuItem: Types = {
  styleOverrides: {
    root: {
      minWidth: pxToRem(160),
      minHeight: "unset",
      padding: `${pxToRem(4.8)} ${pxToRem(16)}`,
      borderRadius: borderRadius.md,
      fontSize: size.sm,
      color: rgba(white.main, 0.8),
      transition: "background-color 300ms ease, color 300ms ease",

      "&:hover, &:focus, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus":
        {
          backgroundColor: dark.main,
          color: white.main,
        },
    },
  },
}

export default menuItem
