// @mui material components
import Drawer from '@mui/material/Drawer'
import type { Theme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'

export default styled(Drawer)(({ theme, ownerState }: { theme?: Theme | any; ownerState: any }) => {
  const { palette, boxShadows, transitions, breakpoints, functions } = theme
  const { transparentSidenav, whiteSidenav, miniSidenav, darkMode } = ownerState

  const sidebarWidth = 240
  const { transparent, gradients, white, background } = palette
  const { xxl } = boxShadows
  const { pxToRem, linearGradient } = functions

  let backgroundValue = darkMode ? background.sidenav : linearGradient(gradients.dark.main, gradients.dark.state)

  if (transparentSidenav) {
    backgroundValue = transparent.main
  } else if (whiteSidenav) {
    backgroundValue = white.main
  }

  // styles for the sidenav when miniSidenav={false}
  const drawerOpenStyles = () => ({
    background: backgroundValue,
    transform: 'translateX(0)',
    transition: transitions.create('transform', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.shorter,
    }),

    [breakpoints.up('xl')]: {
      boxShadow: transparentSidenav ? 'none' : xxl,
      marginBottom: transparentSidenav ? 0 : 'inherit',
      left: '0',
      width: sidebarWidth,
      transform: 'translateX(0)',
      transition: transitions.create(['width', 'background-color'], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.enteringScreen,
      }),
    },
  })

  // styles for the sidenav when miniSidenav={true}
  const drawerCloseStyles = () => ({
    background: backgroundValue,
    transform: `translateX(${pxToRem(-320)})`,
    transition: transitions.create('transform', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.shorter,
    }),

    [breakpoints.up('xl')]: {
      boxShadow: transparentSidenav ? 'none' : xxl,
      marginBottom: transparentSidenav ? 0 : 'inherit',
      left: '0',
      width: pxToRem(64),
      overflowX: 'hidden',
      transform: 'translateX(0)',
      transition: transitions.create(['width', 'background-color'], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.shorter,
      }),
    },
  })

  return {
    '& .MuiDrawer-paper': {
      boxShadow: xxl,
      // border: "none",
      borderRightWidth: '1px',
      borderRightStyle: 'solid',
      borderRightColor: darkMode ? '#272930' : '#DFDFDF',

      ...(miniSidenav ? drawerCloseStyles() : drawerOpenStyles()),
    },
  }
})
