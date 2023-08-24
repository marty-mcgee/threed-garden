// @mui material components
import Box from '@mui/material/Box'
import { styled, Theme } from '@mui/material'

export default styled(Box)(({ theme, ownerState }: { theme?: Theme; ownerState: any }) => {
  const { palette, typography, borders, functions } = theme
  const { color } = ownerState

  const { white, gradients } = palette
  const { size, fontWeightMedium } = typography
  const { borderRadius } = borders
  const { pxToRem, linearGradient } = functions

  // backgroundImage value
  const backgroundImageValue = gradients[color]
    ? linearGradient(gradients[color].main, gradients[color].state)
    : linearGradient(gradients.info.main, gradients.info.state)

  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: pxToRem(60),
    backgroundImage: backgroundImageValue,
    color: white.main,
    position: 'relative',
    padding: pxToRem(16),
    marginBottom: pxToRem(16),
    borderRadius: borderRadius.md,
    fontSize: size.md,
    fontWeight: fontWeightMedium,
  }
})
