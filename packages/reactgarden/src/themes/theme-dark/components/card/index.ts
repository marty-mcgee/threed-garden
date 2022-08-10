// Company Juice Dashboard Base Styles
import colors from "themes/theme-dark/base/colors"
import borders from "themes/theme-dark/base/borders"
import boxShadows from "themes/theme-dark/base/boxShadows"

// Company Juice Dashboard Helper Function
import rgba from "themes/theme-dark/functions/rgba"

const { black, background } = colors
const { borderWidth, borderRadius } = borders
const { md } = boxShadows

// types
type Types = any

const card: Types = {
  styleOverrides: {
    root: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minWidth: 0,
      wordWrap: "break-word",
      backgroundImage: "none",
      backgroundColor: background.card,
      backgroundClip: "border-box",
      border: `${borderWidth[0]} solid ${rgba(black.main, 0.125)}`,
      borderRadius: borderRadius.xl,
      boxShadow: md,
      overflow: "visible",
    },
  },
}

export default card
