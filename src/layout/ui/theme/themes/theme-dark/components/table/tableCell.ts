// ThreeD Garden Base Styles
import borders from '#/layout/ui/theme/themes/theme-dark/base/borders'
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-dark/functions/pxToRem'

const { borderWidth } = borders
const { light } = colors

// types
type Types = any

const tableCell: Types = {
  styleOverrides: {
    root: {
      padding: `${pxToRem(12)} ${pxToRem(16)}`,
      borderBottom: `${borderWidth[1]} solid ${light.main}`,
    },
  },
}

export default tableCell
