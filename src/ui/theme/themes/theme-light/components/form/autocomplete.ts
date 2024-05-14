// ThreeD Garden Base Styles
import boxShadows from '#/ui/theme/themes/theme-light/base/boxShadows'
import typography from '#/ui/theme/themes/theme-light/base/typography'
import colors from '#/ui/theme/themes/theme-light/base/colors'
import borders from '#/ui/theme/themes/theme-light/base/borders'

// ThreeD Garden Helper Functions
import pxToRem from '#/ui/theme/themes/theme-light/functions/pxToRem'

const { lg } = boxShadows
const { size } = typography
const { text, white, transparent, light, dark, gradients } = colors
const { borderRadius } = borders

// types
type Types = any

const autocomplete: Types = {
  styleOverrides: {
    popper: {
      boxShadow: lg,
      padding: pxToRem(8),
      fontSize: size.sm,
      color: text.main,
      textAlign: 'left',
      backgroundColor: `${white.main} !important`,
      borderRadius: borderRadius.md,
    },

    paper: {
      boxShadow: 'none',
      backgroundColor: transparent.main,
    },

    option: {
      padding: `${pxToRem(4.8)} ${pxToRem(16)}`,
      borderRadius: borderRadius.md,
      fontSize: size.sm,
      color: text.main,
      transition: 'background-color 300ms ease, color 300ms ease',

      '&:hover, &:focus, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': {
        backgroundColor: light.main,
        color: dark.main,
      },

      '&[aria-selected="true"]': {
        backgroundColor: `${light.main} !important`,
        color: `${dark.main} !important`,
      },
    },

    noOptions: {
      fontSize: size.sm,
      color: text.main,
    },

    groupLabel: {
      color: dark.main,
    },

    loading: {
      fontSize: size.sm,
      color: text.main,
    },

    tag: {
      display: 'flex',
      alignItems: 'center',
      height: 'auto',
      padding: pxToRem(4),
      backgroundColor: gradients.dark.state,
      color: white.main,

      '& .MuiChip-label': {
        lineHeight: 1.2,
        padding: `0 ${pxToRem(10)} 0 ${pxToRem(4)}`,
      },

      '& .MuiSvgIcon-root, & .MuiSvgIcon-root:hover, & .MuiSvgIcon-root:focus': {
        color: white.main,
        marginRight: 0,
      },
    },
  },
}

export default autocomplete
