// @mui material components
import type { Theme } from '@mui/material/styles'

function defaultItemIconBox(theme: Theme, ownerState: any) {
  const { functions, palette, borders } = theme
  const { color } = ownerState

  const { pxToRem, linearGradient } = functions
  const { gradients, dark, white } = palette
  const { borderRadius } = borders

  return {
    display: 'grid',
    placeItems: 'center',
    width: pxToRem(48),
    height: pxToRem(48),
    borderRadius: borderRadius.md,
    color: color === 'light' ? dark.mian : white.main,
    background: gradients[color]
      ? linearGradient(gradients[color].main, gradients[color].state)
      : linearGradient(gradients.info.main, gradients.info.state),
  }
}

export default defaultItemIconBox
