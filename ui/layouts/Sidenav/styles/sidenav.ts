// @mui material components
import { Theme } from '@mui/material/styles'

export default function sidenavLogoLabel(theme: ThreedTheme, ownerState: any) {
  const { functions, transitions, typography, breakpoints } = theme
  const { miniSidenav } = ownerState

  const { pxToRem } = functions
  const { fontWeightMedium } = typography

  return {
    ml: 1,
    fontWeight: fontWeightMedium,
    wordSpacing: pxToRem(-1),
    transition: transitions.create('opacity', {
      easing: transitions.easing.easeInOut,
      duration: transitions.duration.standard,
    }),

    [breakpoints.up('xl')]: {
      opacity: miniSidenav ? 0 : 1,
    },
  }
}
