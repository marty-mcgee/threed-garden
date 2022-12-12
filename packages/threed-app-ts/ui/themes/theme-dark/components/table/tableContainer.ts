// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-dark/base/colors'
import boxShadows from '~/ui/themes/theme-dark/base/boxShadows'
import borders from '~/ui/themes/theme-dark/base/borders'

const { background } = colors
const { md } = boxShadows
const { borderRadius } = borders

// types
type Types = any

const tableContainer: Types = {
  styleOverrides: {
    root: {
      backgroundColor: background.card,
      boxShadow: md,
      borderRadius: borderRadius.xl,
    },
  },
}

export default tableContainer
