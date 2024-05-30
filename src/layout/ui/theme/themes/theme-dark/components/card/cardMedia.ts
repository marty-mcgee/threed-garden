// ThreeD Garden Base Styles
import borders from '#/layout/ui/theme/themes/theme-dark/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-dark/functions/pxToRem'

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
