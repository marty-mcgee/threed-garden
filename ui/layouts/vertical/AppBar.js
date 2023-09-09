// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

// ** Component Imports
import VerticalNavHeader from '#/ui/layouts/vertical/VerticalNavHeader'

// ** Util Imports
import { hexToRGBA } from '#/lib/utils/hex-to-rgba'

const ThreedAppBar = styled(AppBar)(({ theme }) => ({
  // border: '3px dashed pink', // is working here
  transition: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.0, 2.5, 0.0, 1.7),
  backgroundColor: 'transparent',
  color: theme.palette.text.primary,
  minHeight: theme.mixins.toolbar.minHeight,
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1.0),
    paddingRight: theme.spacing(1.0),
  },
}))

const ThreedToolbar = styled(Toolbar)(({ theme }) => ({
  // border: '3px dashed yellow', // is working here
  width: '100%',
  borderBottomLeftRadius: 10,
  borderBottomRightRadius: 10,
  padding: `${theme.spacing(0)} !important`,
  minHeight: `${theme.mixins.toolbar.minHeight}px !important`,
  transition: 'padding .25s ease-in-out, box-shadow .25s ease-in-out, backdrop-filter .25s ease-in-out',
}))

const LayoutAppBar = (props) => {
  // ** Props
  const { settings, verticalAppBarContent: userVerticalAppBarContent } = props

  // ** Hooks
  const theme = useTheme()
  const scrollTrigger = useScrollTrigger({ threshold: 0, disableHysteresis: true })

  // ** Vars
  const { skin, appBar, appBarBlur, contentWidth } = settings

  const appBarFixedStyles = () => {
    return {
      border: '3px dashed orange !important', // is working here (scroll down to activate)
      px: `${theme.spacing(5)} !important`,
      ...(appBarBlur && { backdropFilter: 'blur(8px)' }),
      boxShadow: theme.shadows[skin === 'bordered' ? 0 : 3],
      backgroundColor: hexToRGBA(theme.palette.background.paper, appBarBlur ? 0.85 : 1),
      ...(skin === 'bordered' && { border: `1px solid ${theme.palette.divider}`, borderTopWidth: 0 }),
    }
  }
  if (appBar === 'hidden') {
    return null
  }

  return (
    <ThreedAppBar
      elevation={0}
      color='default'
      className='layout-navbar'
      position={appBar === 'fixed' ? 'sticky' : 'static'}
    >
      <ThreedToolbar
        className='navbar-content-container'
        sx={{
          ...(appBar === 'fixed' && scrollTrigger && { ...appBarFixedStyles() }),
          ...(contentWidth === 'boxed' && {
            '@media (min-width:1440px)': { maxWidth: `calc(1440px - ${theme.spacing(6)} * 2)` },
          }),
        }}
      >
        {/* LOGO + MENU DRAWER CONTROLS */}
        <VerticalNavHeader {...props} />
        {/* RIGHT-SIDE CONTROLS + USER ACCOUNT MENU */}
        {(userVerticalAppBarContent && userVerticalAppBarContent(props)) || null}
      </ThreedToolbar>
    </ThreedAppBar>
  )
}

export default LayoutAppBar
