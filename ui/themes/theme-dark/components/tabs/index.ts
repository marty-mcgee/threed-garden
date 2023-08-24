// ThreeD Garden Base Styles
import colors from '#/ui/themes/theme-dark/base/colors'
import borders from '#/ui/themes/theme-dark/base/borders'
import boxShadows from '#/ui/themes/theme-dark/base/boxShadows'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-dark/functions/pxToRem'

const { background } = colors
const { borderRadius } = borders
const { md } = boxShadows

// types
type Types = any

const tabs: Types = {
  styleOverrides: {
    root: {
      position: 'relative',
      backgroundColor: background.card,
      borderRadius: borderRadius.xl,
      minHeight: 'unset',
      padding: pxToRem(4),
    },

    flexContainer: {
      height: '100%',
      position: 'relative',
      zIndex: 10,
    },

    fixed: {
      overflow: 'unset !important',
      overflowX: 'unset !important',
    },

    vertical: {
      '& .MuiTabs-indicator': {
        width: '100%',
      },
    },

    indicator: {
      height: '100%',
      borderRadius: borderRadius.lg,
      backgroundColor: background.default,
      boxShadow: md,
      transition: 'all 500ms ease',
    },
  },
}

export default tabs
