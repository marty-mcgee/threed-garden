// ThreeD Garden Base Styles
import typography from '#/ui/theme/themes/theme-dark/base/typography'
import borders from '#/ui/theme/themes/theme-dark/base/borders'
import colors from '#/ui/theme/themes/theme-dark/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/theme/themes/theme-dark/functions/pxToRem'
import rgba from '#/ui/theme/themes/theme-dark/functions/rgba'

const { size } = typography
const { white } = colors
const { borderWidth, borderColor } = borders

// types
type Types = any

const dialogContent: Types = {
  styleOverrides: {
    root: {
      padding: pxToRem(16),
      fontSize: size.md,
      color: rgba(white.main, 0.8),
    },

    dividers: {
      borderTop: `${borderWidth[1]} solid ${rgba(borderColor, 0.6)}`,
      borderBottom: `${borderWidth[1]} solid ${rgba(borderColor, 0.6)}`,
    },
  },
}

export default dialogContent
