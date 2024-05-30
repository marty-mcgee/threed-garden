// @mui material components
import Fade from '@mui/material/Fade'

// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'
import typography from '#/layout/ui/theme/themes/theme-dark/base/typography'
import borders from '#/layout/ui/theme/themes/theme-dark/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-dark/functions/pxToRem'

const { black, white } = colors
const { size, fontWeightRegular } = typography
const { borderRadius } = borders

// types
type Types = any

const tooltip: Types = {
  defaultProps: {
    arrow: true,
    TransitionComponent: Fade,
  },

  styleOverrides: {
    tooltip: {
      maxWidth: pxToRem(200),
      backgroundColor: black.main,
      color: white.main,
      fontSize: size.sm,
      fontWeight: fontWeightRegular,
      textAlign: 'center',
      borderRadius: borderRadius.md,
      opacity: 0.7,
      padding: `${pxToRem(5)} ${pxToRem(8)} ${pxToRem(4)}`,
    },

    arrow: {
      color: black.main,
    },
  },
}

export default tooltip
