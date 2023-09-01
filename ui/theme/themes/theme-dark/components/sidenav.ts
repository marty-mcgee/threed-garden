// ThreeD Garden Base Styles
import colors from '#/ui/theme/themes/theme-dark/base/colors'
import borders from '#/ui/theme/themes/theme-dark/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/theme/themes/theme-dark/functions/pxToRem'

const { background } = colors
const { borderRadius } = borders

// types
type Types = any

const sidenav: Types = {
  styleOverrides: {
    root: {
      width: pxToRem(240),
      whiteSpace: 'nowrap',
      border: 'none',
    },

    paper: {
      width: pxToRem(240),
      backgroundColor: background.sidenav,
      height: `calc(100vh - ${pxToRem(0)})`,
      margin: pxToRem(0),
      borderRadius: 0, // borderRadius.xl,
      border: 'none',
    },

    paperAnchorDockedLeft: {
      borderRight: 'none',
    },
  },
}

export default sidenav
