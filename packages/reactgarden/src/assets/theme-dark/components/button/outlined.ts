// Company Juice Dashboard Base Styles
import colors from "assets/theme-dark/base/colors"
import typography from "assets/theme-dark/base/typography"

// Company Juice Dashboard Helper Functions
import pxToRem from "assets/theme-dark/functions/pxToRem"

const { transparent, light, info, secondary } = colors
const { size } = typography

const outlined = {
  base: {
    minHeight: pxToRem(39),
    color: light.main,
    borderColor: light.main,
    padding: `${pxToRem(9)} ${pxToRem(24)}`,

    "&:hover": {
      opacity: 0.75,
      backgroundColor: transparent.main,
    },

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(16)} !important`,
    },
  },

  small: {
    minHeight: pxToRem(31),
    padding: `${pxToRem(6)} ${pxToRem(18)}`,
    fontSize: size.xs,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(12)} !important`,
    },
  },

  large: {
    minHeight: pxToRem(46),
    padding: `${pxToRem(12)} ${pxToRem(64)}`,
    fontSize: size.sm,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(22)} !important`,
    },
  },

  primary: {
    backgroundColor: transparent.main,
    borderColor: info.main,

    "&:hover": {
      backgroundColor: transparent.main,
    },
  },

  secondary: {
    backgroundColor: transparent.main,
    borderColor: secondary.main,

    "&:hover": {
      backgroundColor: transparent.main,
    },
  },
}

export default outlined
