// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'
import borders from '~/ui/themes/theme-light/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'

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
