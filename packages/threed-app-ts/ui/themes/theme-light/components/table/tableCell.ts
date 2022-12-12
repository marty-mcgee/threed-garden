// ThreeD Garden Base Styles
import borders from '~/ui/themes/theme-light/base/borders'
import colors from '~/ui/themes/theme-light/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'

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
