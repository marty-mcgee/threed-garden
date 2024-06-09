// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-light/base/colors'
import borders from '#/layout/ui/theme/themes/theme-light/base/borders'
import boxShadows from '#/layout/ui/theme/themes/theme-light/base/boxShadows'

// ThreeD Garden Helper Function
import rgba from '#/layout/ui/theme/themes/theme-light/functions/rgba'

const { black, white } = colors
const { borderWidth, borderRadius } = borders
const { md } = boxShadows

// types
// types
type Types = any

const card: Types = {
  styleOverrides: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minWidth: 0,
      wordWrap: 'break-word',
      backgroundColor: white.main,
      backgroundClip: 'border-box',
      border: `${borderWidth[0]} solid ${rgba(black.main, 0.125)}`,
      borderRadius: borderRadius.xl,
      boxShadow: md,
      overflow: 'visible',
    },
  },
}

export default card
