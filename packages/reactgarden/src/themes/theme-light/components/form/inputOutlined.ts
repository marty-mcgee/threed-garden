// Company Juice Dashboard Base Styles
import colors from "themes/theme-light/base/colors"
import borders from "themes/theme-light/base/borders"
import typography from "themes/theme-light/base/typography"

// // Company Juice DashboardUI Dashboard PRO helper functions
import pxToRem from "themes/theme-light/functions/pxToRem"

const { inputBorderColor, info, grey, transparent } = colors
const { borderRadius } = borders
const { size } = typography

// types
type Types = any

const inputOutlined: Types = {
  styleOverrides: {
    root: {
      backgroundColor: transparent.main,
      fontSize: size.sm,
      borderRadius: borderRadius.md,

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: inputBorderColor,
      },

      "&.Mui-focused": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: info.main,
        },
      },
    },

    notchedOutline: {
      borderColor: inputBorderColor,
    },

    input: {
      color: grey[700],
      padding: pxToRem(12),
      backgroundColor: transparent.main,
    },

    inputSizeSmall: {
      fontSize: size.xs,
      padding: pxToRem(10),
    },

    multiline: {
      color: grey[700],
      padding: 0,
    },
  },
}

export default inputOutlined
