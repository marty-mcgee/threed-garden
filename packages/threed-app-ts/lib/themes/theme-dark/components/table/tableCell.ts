// ThreeD Garden Base Styles
import borders from '~/themes/theme-dark/base/borders'
import colors from '~/themes/theme-dark/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '~/themes/theme-dark/functions/pxToRem'

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
