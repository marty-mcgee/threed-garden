// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'
import borders from '~/ui/themes/theme-light/base/borders'
import boxShadows from '~/ui/themes/theme-light/base/boxShadows'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'
import boxShadow from '~/ui/themes/theme-light/functions/boxShadow'

const { grey, white, black, info } = colors
const { borderRadius, borderWidth } = borders
const { sliderBoxShadow } = boxShadows

// types
type Types = any

const slider: Types = {
  styleOverrides: {
    root: {
      width: '100%',

      '& .MuiSlider-active, & .Mui-focusVisible': {
        boxShadow: 'none !important',
      },

      '& .MuiSlider-valueLabel': {
        color: black.main,
      },
    },

    rail: {
      height: pxToRem(2),
      background: grey[200],
      borderRadius: borderRadius.sm,
      opacity: 1,
    },

    track: {
      background: info.main,
      height: pxToRem(2),
      position: 'relative',
      border: 'none',
      borderRadius: borderRadius.lg,
      zIndex: 1,
    },

    thumb: {
      width: pxToRem(14),
      height: pxToRem(14),
      backgroundColor: white.main,
      zIndex: 10,
      boxShadow: sliderBoxShadow.thumb,
      border: `${borderWidth[1]} solid ${info.main}`,
      transition: 'all 200ms linear',

      '&:hover': {
        boxShadow: 'none',
      },

      '&:active': {
        transform: 'translate(-50%, -50%) scale(1.4)',
      },

      '&.Mui-active': {
        boxShadow: boxShadow([0, 0], [0, 14], info.main, 0.16),
      },
    },
  },
}

export default slider
