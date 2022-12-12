// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'
import borders from '~/ui/themes/theme-light/base/borders'
import typography from '~/ui/themes/theme-light/base/typography'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'

const { light, text, dark } = colors
const { borderRadius } = borders
const { size } = typography

// types
type Types = any

const menuItem: Types = {
  styleOverrides: {
    root: {
      minWidth: pxToRem(160),
      minHeight: 'unset',
      padding: `${pxToRem(4.8)} ${pxToRem(16)}`,
      borderRadius: borderRadius.md,
      fontSize: size.sm,
      color: text.main,
      transition: 'background-color 300ms ease, color 300ms ease',

      '&:hover, &:focus, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': {
        backgroundColor: light.main,
        color: dark.main,
      },
    },
  },
}

export default menuItem
