// ThreeD Garden Base Styles
import boxShadows from '#/ui/themes/theme-light/base/boxShadows'
import typography from '#/ui/themes/theme-light/base/typography'
import colors from '#/ui/themes/theme-light/base/colors'
import borders from '#/ui/themes/theme-light/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-light/functions/pxToRem'

const { lg } = boxShadows
const { size } = typography
const { text, white } = colors
const { borderRadius } = borders

// types
type Types = any

const menu: Types = {
  defaultProps: {
    disableAutoFocusItem: true,
  },

  styleOverrides: {
    paper: {
      minWidth: pxToRem(160),
      boxShadow: lg,
      padding: `${pxToRem(16)} ${pxToRem(8)}`,
      fontSize: size.sm,
      color: text.main,
      textAlign: 'left',
      backgroundColor: `${white.main} !important`,
      borderRadius: borderRadius.md,
    },
  },
}

export default menu
