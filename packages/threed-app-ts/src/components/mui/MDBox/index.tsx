import { forwardRef, FC } from 'react'

// @mui material components
import { BoxProps } from '@mui/material'

// Custom styles for MDBox
import MDBoxRoot from '~/components/mui/MDBox/MDBoxRoot'

// declaring props types for MDBox
interface Props extends BoxProps {
  variant?: 'contained' | 'gradient'
  bgColor?: string
  color?: string
  opacity?: number
  borderRadius?: string
  shadow?: string
  coloredShadow?: string
  [key: string]: any
}

const MDBox: FC<Props> = forwardRef(
  ({ variant, bgColor, color, opacity, borderRadius, shadow, coloredShadow, ...rest }, ref) => (
    <MDBoxRoot
      {...rest}
      ref={ref}
      ownerState={{
        variant,
        bgColor,
        color,
        opacity,
        borderRadius,
        shadow,
        coloredShadow,
      }}
    />
  )
)

// Declaring default props for MDBox
MDBox.defaultProps = {
  variant: 'contained',
  bgColor: 'transparent',
  color: 'dark',
  opacity: 1,
  borderRadius: 'none',
  shadow: 'none',
  coloredShadow: 'none',
}

export default MDBox
