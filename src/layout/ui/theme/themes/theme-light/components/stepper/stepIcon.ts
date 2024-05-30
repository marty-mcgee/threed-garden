// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-light/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '#/layout/ui/theme/themes/theme-light/functions/pxToRem'
import boxShadow from '#/layout/ui/theme/themes/theme-light/functions/boxShadow'

const { white } = colors

// types
type Types = any

const stepIcon: Types = {
  styleOverrides: {
    root: {
      background: '#9fc9ff',
      fill: '#9fc9ff',
      stroke: '#9fc9ff',
      strokeWidth: pxToRem(10),
      width: pxToRem(13),
      height: pxToRem(13),
      borderRadius: '50%',
      zIndex: 99,
      transition: 'all 200ms linear',

      '&.Mui-active': {
        background: white.main,
        fill: white.main,
        stroke: white.main,
        borderColor: white.main,
        boxShadow: boxShadow([0, 0], [0, 2], white.main, 1),
      },

      '&.Mui-completed': {
        background: white.main,
        fill: white.main,
        stroke: white.main,
        borderColor: white.main,
        boxShadow: boxShadow([0, 0], [0, 2], white.main, 1),
      },
    },
  },
}

export default stepIcon
