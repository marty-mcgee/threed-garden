// Company Juice Dashboard Base Styles
import typography from "themes/theme-dark/base/typography"
import colors from "themes/theme-dark/base/colors"

// Company Juice Dashboard Helper Functions
import pxToRem from "themes/theme-dark/functions/pxToRem"
import rgba from "themes/theme-dark/functions/rgba"

const { size, fontWeightRegular } = typography
const { white } = colors

// types
type Types = any

const stepLabel: Types = {
  styleOverrides: {
    label: {
      marginTop: `${pxToRem(8)} !important`,
      fontWeight: fontWeightRegular,
      fontSize: size.xs,
      color: "#9fc9ff",
      textTransform: "uppercase",

      "&.Mui-active": {
        fontWeight: `${fontWeightRegular} !important`,
        color: `${rgba(white.main, 0.8)} !important`,
      },

      "&.Mui-completed": {
        fontWeight: `${fontWeightRegular} !important`,
        color: `${rgba(white.main, 0.8)} !important`,
      },
    },
  },
}

export default stepLabel
