// Company Juice Dashboard Base Styles
import colors from "themes/theme-dark/base/colors"
import borders from "themes/theme-dark/base/borders"
import boxShadows from "themes/theme-dark/base/boxShadows"

// Company Juice Dashboard Helper Functions
// import rgba from "themes/theme-dark/functions/rgba";
import pxToRem from "themes/theme-dark/functions/pxToRem"
import linearGradient from "themes/theme-dark/functions/linearGradient"

const { white, gradients, grey, transparent } = colors
const { borderWidth } = borders
const { md } = boxShadows

// types
type Types = any

const switchButton: Types = {
  defaultProps: {
    disableRipple: false,
  },

  styleOverrides: {
    switchBase: {
      color: gradients.dark.main,

      "&:hover": {
        backgroundColor: transparent.main,
      },

      "&.Mui-checked": {
        color: gradients.dark.main,

        "&:hover": {
          backgroundColor: transparent.main,
        },

        "& .MuiSwitch-thumb": {
          borderColor: `${gradients.dark.main} !important`,
        },

        "& + .MuiSwitch-track": {
          backgroundColor: `${gradients.dark.main} !important`,
          borderColor: `${gradients.dark.main} !important`,
          opacity: 1,
        },
      },

      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: "0.3 !important",
      },

      "&.Mui-focusVisible .MuiSwitch-thumb": {
        backgroundImage: linearGradient(
          gradients.info.main,
          gradients.info.state
        ),
      },
    },

    thumb: {
      backgroundColor: white.main,
      boxShadow: md,
      border: `${borderWidth[1]} solid ${grey[400]}`,
    },

    track: {
      width: pxToRem(32),
      height: pxToRem(15),
      backgroundColor: grey[400],
      border: `${borderWidth[1]} solid ${grey[400]}`,
      opacity: 1,
    },

    checked: {},
  },
}

export default switchButton
