// ThreeD Garden Base Styles
import colors from '#/ui/theme/themes/theme-light/base/colors'
import borders from '#/ui/theme/themes/theme-light/base/borders'
import boxShadows from '#/ui/theme/themes/theme-light/base/boxShadows'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/theme/themes/theme-light/functions/pxToRem'

const { grey, white } = colors
const { borderRadius } = borders
const { tabsBoxShadow } = boxShadows

// types
type Types = any

const tabs: Types = {
  styleOverrides: {
    root: {
      position: 'relative',
      backgroundColor: grey[100],
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
      backgroundColor: white.main,
      boxShadow: tabsBoxShadow.indicator,
      transition: 'all 500ms ease',
    },
  },
}

export default tabs
