// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'

const { transparent } = colors

// types
type Types = any

const iconButton: Types = {
  styleOverrides: {
    root: {
      '&:hover': {
        backgroundColor: transparent.main,
      },
    },
  },
}

export default iconButton
