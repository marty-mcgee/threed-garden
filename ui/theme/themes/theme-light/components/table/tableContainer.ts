// ThreeD Garden Base Styles
import colors from '#/ui/theme/themes/theme-light/base/colors'
import boxShadows from '#/ui/theme/themes/theme-light/base/boxShadows'
import borders from '#/ui/theme/themes/theme-light/base/borders'

const { white } = colors
const { md } = boxShadows
const { borderRadius } = borders

// types
type Types = any

const tableContainer: Types = {
  styleOverrides: {
    root: {
      backgroundColor: white.main,
      boxShadow: md,
      borderRadius: borderRadius.xl,
    },
  },
}

export default tableContainer
