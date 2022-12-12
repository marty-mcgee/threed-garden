// ThreeD Garden Base Styles
import borders from '~/ui/themes/theme-light/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'

const { borderRadius } = borders

// types
type Types = any

const cardMedia: Types = {
  styleOverrides: {
    root: {
      borderRadius: borderRadius.xl,
      margin: `${pxToRem(16)} ${pxToRem(16)} 0`,
    },

    media: {
      width: 'auto',
    },
  },
}

export default cardMedia
