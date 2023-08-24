// ThreeD Garden Base Styles
import typography from '#/ui/themes/theme-dark/base/typography'
import borders from '#/ui/themes/theme-dark/base/borders'
import colors from '#/ui/themes/theme-dark/base/colors'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/themes/theme-dark/functions/pxToRem'

const { size, fontWeightRegular } = typography
const { borderRadius } = borders
const { white } = colors

// types
type Types = any

const tab: Types = {
  styleOverrides: {
    root: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      flex: '1 1 auto',
      textAlign: 'center',
      maxWidth: 'unset !important',
      minWidth: 'unset !important',
      minHeight: 'unset !important',
      fontSize: size.md,
      fontWeight: fontWeightRegular,
      textTransform: 'none',
      lineHeight: 'inherit',
      padding: pxToRem(4),
      borderRadius: borderRadius.lg,
      color: `${white.main} !important`,
      opacity: '1 !important',

      '& .material-icons, .material-icons-round': {
        marginBottom: '0 !important',
        marginRight: pxToRem(6),
      },

      '& svg': {
        marginBottom: '0 !important',
        marginRight: pxToRem(6),
      },
    },

    labelIcon: {
      paddingTop: pxToRem(4),
    },
  },
}

export default tab
