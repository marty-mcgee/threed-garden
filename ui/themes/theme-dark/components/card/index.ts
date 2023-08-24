// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-dark/base/colors'
import borders from '#/ui/themes/theme-dark/base/borders'
import boxShadows from '#/ui/themes/theme-dark/base/boxShadows'

// ThreeD Garden Helper Function
import rgba from '#/ui/themes/theme-dark/functions/rgba'

const { black, background } = colors
const { borderWidth, borderRadius } = borders
const { md } = boxShadows

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
      backgroundImage: 'none',
      backgroundColor: background.card,
      backgroundClip: 'border-box',
      border: `${borderWidth[0]} solid ${rgba(black.main, 0.125)}`,
      borderRadius: borderRadius.xl,
      boxShadow: md,
      overflow: 'visible',
    },
  },
}

export default card
