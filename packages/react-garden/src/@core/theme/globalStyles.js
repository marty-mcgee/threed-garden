// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const GlobalStyles = (theme, settings) => {
  // ** Vars
  const { skin } = settings

  const perfectScrollbarThumbBgColor = () => {
    if (skin === 'semi-dark' && theme.palette.mode === 'light') {
      return '#504B6D !important'
    } else if (skin === 'semi-dark' && theme.palette.mode === 'dark') {
      return '#C2C4D1 !important'
    } else if (theme.palette.mode === 'light') {
      return '#C2C4D1 !important'
    } else {
      return '#504B6D !important'
    }
  }

  return {
    'body[style^="padding-right"] .layout-navbar-and-nav-container::after': {
      content: '""',
      position: 'absolute',
      left: '100%',
      top: 0,
      height: '100%',
      backgroundColor: hexToRGBA(theme.palette.background.paper, 0.85),
      width: '30px'
    },
    '.demo-space-x > *': {
      marginTop: '1rem !important',
      marginRight: '1rem !important',
      'body[dir="rtl"] &': {
        marginRight: '0 !important',
        marginLeft: '1rem !important'
      }
    },
    '.demo-space-y > *:not(:last-of-type)': {
      marginBottom: '1rem'
    },
    '.MuiGrid-container.match-height .MuiCard-root': {
      height: '100%'
    },
    '.ps__rail-y': {
      zIndex: 1,
      right: '0 !important',
      left: 'auto !important',
      '&:hover, &:focus, &.ps--clicking': {
        backgroundColor: theme.palette.mode === 'light' ? '#E4E5EB !important' : '#423D5D !important'
      },
      '& .ps__thumb-y': {
        right: '3px !important',
        left: 'auto !important',
        backgroundColor: theme.palette.mode === 'light' ? '#C2C4D1 !important' : '#504B6D !important'
      },
      '.layout-vertical-nav &': {
        '& .ps__thumb-y': {
          width: 4,
          backgroundColor: perfectScrollbarThumbBgColor()
        },
        '&:hover, &:focus, &.ps--clicking': {
          backgroundColor: 'transparent !important',
          '& .ps__thumb-y': {
            width: 6
          }
        }
      }
    },
    '#nprogress': {
      pointerEvents: 'none',
      '& .bar': {
        left: 0,
        top: 0,
        height: 3,
        width: '100%',
        zIndex: 2000,
        position: 'fixed',
        backgroundColor: theme.palette.primary.main
      }
    }
  }
}

export default GlobalStyles
