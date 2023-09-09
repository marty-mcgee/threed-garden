// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'

const ThreedSwipeableDrawer = styled(SwipeableDrawer)({
  overflowX: 'scroll', // hidden | scroll
  transition: 'width .25s ease-in-out',
  '& ul': {
    listStyle: 'none',
  },
  '& .MuiListItem-gutters': {
    paddingLeft: 4,
    paddingRight: 4,
  },
  '& .MuiDrawer-paper': {
    left: 'unset',
    right: 'unset',
    overflowX: 'scroll', // hidden | scroll
    transition: 'width .25s ease-in-out, box-shadow .25s ease-in-out',
  },
})

const Drawer = (props) => {
  // ** Props
  const {
    hidden,
    children,
    navHover,
    navWidth,
    settings,
    navVisible,
    setNavHover,
    setNavVisible,
    collapsedNavWidth,
    navBorderWidth,
  } = props

  // ** Hook
  const theme = useTheme()

  // ** Vars
  const { skin, navCollapsed } = settings

  const drawerColor = () => {
    if (skin === 'semi-dark' && theme.palette.mode === 'light') {
      return {
        '& .MuiTypography-root, & .MuiSvgIcon-root': {
          color: `rgba(${theme.palette.customColors.dark}, 0.87)`,
        },
      }
    } else if (skin === 'semi-dark' && theme.palette.mode === 'dark') {
      return {
        '& .MuiTypography-root, & .MuiSvgIcon-root': {
          color: `rgba(${theme.palette.customColors.light}, 0.87)`,
        },
      }
    } else return {}
  }

  const drawerBgColor = () => {
    if (skin === 'semi-dark' && theme.palette.mode === 'light') {
      return {
        backgroundColor: theme.palette.customColors.darkBg,
      }
    } else if (skin === 'semi-dark' && theme.palette.mode === 'dark') {
      return {
        backgroundColor: theme.palette.customColors.lightBg,
      }
    } else {
      return {
        backgroundColor: theme.palette.background.default,
      }
    }
  }

  // Drawer Props for Mobile & Tablet screens
  const MobileDrawerProps = {
    open: navVisible,
    onOpen: () => setNavVisible(true),
    onClose: () => setNavVisible(false),
    ModalProps: {
      keepMounted: true, // Better open performance on mobile.
    },
  }

  // Drawer Props for Desktop screens
  const DesktopDrawerProps = {
    // open: true,
    // onOpen: () => null,
    // onClose: () => null,
    open: navVisible,
    onOpen: () => setNavVisible(true),
    onClose: () => setNavVisible(false),
    // hover effects
    onMouseEnter: () => {
      setNavHover(true)
    },
    onMouseLeave: () => {
      setNavHover(false)
    },
  }

  return (
    <ThreedSwipeableDrawer
      className='layout-vertical-nav'
      variant={hidden ? 'permanent' : 'permanent'} // temporary
      {...(hidden ? { ...MobileDrawerProps } : { ...DesktopDrawerProps })}
      PaperProps={{
        sx: {
          width: navCollapsed && !navHover ? collapsedNavWidth : navWidth,
          mt: 16,
          // backgroundColor: 'yellow',
        },
      }}
      sx={{
        // border: '2px solid grey',
        width: navCollapsed ? collapsedNavWidth : navWidth,
        // flexShrink: 0,
        '& .MuiDrawer-paper': {
          ...drawerColor(),
          ...drawerBgColor(),
          ...(!hidden && navCollapsed && navHover ? { boxShadow: 9 } : {}),
          borderRight: navBorderWidth === 0 ? 0 : `${navBorderWidth}px solid grey`, // ${theme.palette.divider}`,
          // boxSizing: 'border-box',
          // top: ['48px', '56px', '64px'],
          // height: 'auto',
          // bottom: 0,
        },
      }}>
      {children}
    </ThreedSwipeableDrawer>
  )
}

export default Drawer
