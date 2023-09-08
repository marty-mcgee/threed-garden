// @mui material components
import type { Theme, ThreedTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'

export default styled('form')(({ theme, ownerState }: { theme?: ThreedTheme | any; ownerState: any }) => {
  const { palette, typography, borders, functions } = theme
  const { darkMode } = ownerState

  const { text, white, dark, inputBorderColor, transparent } = palette
  const { size } = typography
  const { borderRadius, borderWidth } = borders
  const { rgba } = functions

  return {
    display: 'flex',
    alignItems: 'center',
    border: `${borderWidth[1]} solid ${inputBorderColor} !important`,
    borderRadius: borderRadius.md,

    '&.dropzone': {
      background: `${transparent.main} !important`,
    },

    '& .dz-default': {
      margin: '0 auto !important',
    },

    '& .dz-default .dz-button': {
      color: `${text.main} !important`,
      fontSize: `${size.sm} !important`,
    },

    '& .dz-preview.dz-image-preview': {
      background: `${transparent.main} !important`,
    },

    '& .dz-preview .dz-details': {
      color: `${dark.main} !important`,
      opacity: '1 !important',

      '& .dz-size span, & .dz-filename span': {
        backgroundColor: `${rgba(white.main, 0.7)} !important`,
      },
    },

    '& .dz-error-message': {
      display: 'none !important',
    },

    '& .dz-remove': {
      color: `${darkMode ? white.main : dark.main} !important`,
      textDecoration: 'none',

      '&:hover, &:focus': {
        textDecoration: 'none !important',
      },
    },
  }
})
