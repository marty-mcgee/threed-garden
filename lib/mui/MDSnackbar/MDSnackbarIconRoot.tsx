// @mui material components
import Icon from '@mui/material/Icon'
import type { Theme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'

export default styled(Icon)(({ theme, ownerState }: { theme?: Theme; ownerState: any }) => {
  const { palette, functions, typography } = theme
  const { color, bgWhite } = ownerState

  const { white, transparent, gradients } = palette
  const { pxToRem, linearGradient } = functions
  // const { size } = typography

  // backgroundImage value
  let backgroundImageValue

  if (bgWhite) {
    backgroundImageValue = gradients[color]
      ? linearGradient(gradients[color].main, gradients[color].state)
      : linearGradient(gradients.info.main, gradients.info.state)
  } else if (color === 'light') {
    backgroundImageValue = linearGradient(gradients.dark.main, gradients.dark.state)
  }

  return {
    backgroundImage: backgroundImageValue,
    WebkitTextFillColor: bgWhite || color === 'light' ? transparent.main : white.main,
    WebkitBackgroundClip: 'text',
    marginRight: pxToRem(8),
    // fontSize: size.lg,
    transform: `translateY(${pxToRem(-2)})`,
  }
})
