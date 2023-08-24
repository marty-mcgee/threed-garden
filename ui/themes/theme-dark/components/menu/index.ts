// ThreeD Garden Base Styles
import boxShadows from '#/ui/themes/theme-dark/base/boxShadows'
import typography from '#/ui/themes/theme-dark/base/typography'
import colors from '#/ui/themes/theme-dark/base/colors'
import borders from '#/ui/themes/theme-dark/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-dark/functions/pxToRem'

const { md } = boxShadows
const { size } = typography
const { text, background } = colors
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
      boxShadow: md,
      padding: `${pxToRem(16)} ${pxToRem(8)}`,
      fontSize: size.sm,
      color: text.main,
      textAlign: 'left',
      backgroundColor: `${background.card} !important`,
      borderRadius: borderRadius.md,
    },
  },
}

export default menu
