// ThreeD Garden Button Styles
import root from '~/ui/themes/theme-dark/components/button/root'
import contained from '~/ui/themes/theme-dark/components/button/contained'
import outlined from '~/ui/themes/theme-dark/components/button/outlined'
import buttonText from '~/ui/themes/theme-dark/components/button/text'

// types
type Types = any

const button: Types = {
  defaultProps: {
    disableRipple: false,
  },
  styleOverrides: {
    root: { ...root },
    contained: { ...contained.base },
    containedSizeSmall: { ...contained.small },
    containedSizeLarge: { ...contained.large },
    containedPrimary: { ...contained.primary },
    containedSecondary: { ...contained.secondary },
    outlined: { ...outlined.base },
    outlinedSizeSmall: { ...outlined.small },
    outlinedSizeLarge: { ...outlined.large },
    outlinedPrimary: { ...outlined.primary },
    outlinedSecondary: { ...outlined.secondary },
    text: { ...buttonText.base },
    textSizeSmall: { ...buttonText.small },
    textSizeLarge: { ...buttonText.large },
    textPrimary: { ...buttonText.primary },
    textSecondary: { ...buttonText.secondary },
  },
}

export default button
