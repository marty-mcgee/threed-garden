// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-light/base/colors'
import borders from '#/ui/themes/theme-light/base/borders'
import boxShadows from '#/ui/themes/theme-light/base/boxShadows'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-light/functions/pxToRem'
import linearGradient from '#/ui/themes/theme-light/functions/linearGradient'

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

      '&:hover': {
        backgroundColor: transparent.main,
      },

      '&.Mui-checked': {
        color: gradients.dark.main,

        '&:hover': {
          backgroundColor: transparent.main,
        },

        '& .MuiSwitch-thumb': {
          borderColor: `${gradients.dark.main} !important`,
        },

        '& + .MuiSwitch-track': {
          backgroundColor: `${gradients.dark.main} !important`,
          borderColor: `${gradients.dark.main} !important`,
          opacity: 1,
        },
      },

      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: '0.3 !important',
      },

      '&.Mui-focusVisible .MuiSwitch-thumb': {
        backgroundImage: linearGradient(gradients.info.main, gradients.info.state),
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
