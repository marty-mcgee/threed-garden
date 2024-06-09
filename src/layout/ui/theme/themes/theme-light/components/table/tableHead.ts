// ThreeD Garden Base Styles
import borders from '#/layout/ui/theme/themes/theme-light/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-light/functions/pxToRem'

const { borderRadius } = borders

// types
type Types = any

const tableHead: Types = {
  styleOverrides: {
    root: {
      display: 'block',
      padding: `${pxToRem(16)} ${pxToRem(16)} 0  ${pxToRem(16)}`,
      borderRadius: `${borderRadius.xl} ${borderRadius.xl} 0 0`,
    },
  },
}

export default tableHead
