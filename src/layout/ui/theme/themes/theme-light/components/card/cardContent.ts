// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-light/functions/pxToRem'

// types
type Types = any

const cardContent: Types = {
  styleOverrides: {
    root: {
      marginTop: 0,
      marginBottom: 0,
      padding: `${pxToRem(8)} ${pxToRem(24)} ${pxToRem(24)}`,
    },
  },
}

export default cardContent
