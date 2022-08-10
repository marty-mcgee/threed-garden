// Company Juice Dashboard Base Styles
import boxShadows from "assets/theme/base/boxShadows"
import typography from "assets/theme/base/typography"
import colors from "assets/theme/base/colors"
import borders from "assets/theme/base/borders"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme/functions/pxToRem"

const { lg } = boxShadows
const { size } = typography
const { text, white } = colors
const { borderRadius } = borders

// types
type Types = any

const menu: Types = {
  defaultProps: {
    disableAutoFocusItem: true,
  },

  styleOverrides: {
    paper: {
      minWidth: pxToRem(160),
      boxShadow: lg,
      padding: `${pxToRem(16)} ${pxToRem(8)}`,
      fontSize: size.sm,
      color: text.main,
      textAlign: "left",
      backgroundColor: `${white.main} !important`,
      borderRadius: borderRadius.md,
    },
  },
}

export default menu
