// @mui material components
import Fade from "@mui/material/Fade"

// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-light/base/colors"
import typography from "~/themes/theme-light/base/typography"
import borders from "~/themes/theme-light/base/borders"

// Company Juice Dashboard Helper Functions
import pxToRem from "~/themes/theme-light/functions/pxToRem"

const { black, light } = colors
const { size, fontWeightRegular } = typography
const { borderRadius } = borders

// types
type Types = any

const tooltip: Types = {
  defaultProps: {
    arrow: true,
    TransitionComponent: Fade,
  },

  styleOverrides: {
    tooltip: {
      maxWidth: pxToRem(200),
      backgroundColor: black.main,
      color: light.main,
      fontSize: size.sm,
      fontWeight: fontWeightRegular,
      textAlign: "center",
      borderRadius: borderRadius.md,
      opacity: 0.7,
      padding: `${pxToRem(5)} ${pxToRem(8)} ${pxToRem(4)}`,
    },

    arrow: {
      color: black.main,
    },
  },
}

export default tooltip
