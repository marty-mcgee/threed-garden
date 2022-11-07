// ThreeD Garden Base Styles
import colors from "~/themes/theme-dark/base/colors"

// ThreeD Garden Helper Functions
import pxToRem from "~/themes/theme-dark/functions/pxToRem"

const { transparent } = colors

// types
type Types = any

const select: Types = {
  styleOverrides: {
    select: {
      display: "grid",
      alignItems: "center",
      padding: `0 ${pxToRem(12)} !important`,

      "& .Mui-selected": {
        backgroundColor: transparent.main,
      },
    },

    selectMenu: {
      background: "none",
      height: "none",
      minHeight: "none",
      overflow: "unset",
    },

    icon: {
      display: "none",
    },
  },
}

export default select
