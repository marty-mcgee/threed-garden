// ThreeD Garden Base Styles
import colors from '~/themes/theme-light/base/colors'
import typography from '~/themes/theme-light/base/typography'

const { grey } = colors
const { size } = typography

// types
type Types = any

const breadcrumbs: Types = {
  styleOverrides: {
    li: {
      lineHeight: 0,
    },

    separator: {
      fontSize: size.sm,
      color: grey[600],
    },
  },
}

export default breadcrumbs
