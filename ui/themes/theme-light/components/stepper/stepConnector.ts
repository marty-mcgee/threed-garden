// ThreeD Garden Base Styles
import borders from '#/ui/themes/theme-light/base/borders'
import colors from '#/ui/themes/theme-light/base/colors'

const { white } = colors
const { borderWidth } = borders

// types
type Types = any

const stepConnector: Types = {
  styleOverrides: {
    root: {
      color: '#9fc9ff',
      transition: 'all 200ms linear',

      '&.Mui-active': {
        color: white.main,
      },

      '&.Mui-completed': {
        color: white.main,
      },
    },

    alternativeLabel: {
      top: '14%',
      left: '-50%',
      right: '50%',
    },

    line: {
      borderWidth: `${borderWidth[2]} !important`,
      borderColor: 'currentColor',
      opacity: 0.5,
    },
  },
}

export default stepConnector
