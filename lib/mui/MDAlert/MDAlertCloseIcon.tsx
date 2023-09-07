// @mui material components
import type { ThreedTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'

export default styled('span')(({ theme }: { theme: ThreedTheme }) => {
  const { palette, typography } = theme

  const { white } = palette
  // const { size, fontWeightMedium } = typography
  const { fontWeightMedium } = typography
  // const { pxToRem } = functions

  return {
    color: white.main,
    // fontSize: size.xl,
    // padding: `${pxToRem(9)} ${pxToRem(6)} ${pxToRem(8)}`,
    // marginLeft: pxToRem(40),
    fontWeight: fontWeightMedium,
    cursor: 'pointer',
    lineHeight: 0,
  }
})
