import { FC, ReactNode, forwardRef } from 'react'

// @mui material components
import { ButtonProps } from '@mui/material'

// Custom styles for MDSocialButton
import MDSocialButtonRoot from '#/lib/mui/MDSocialButton/MDSocialButtonRoot'

// Declaring props types for MDButton
interface Props extends Omit<ButtonProps, 'color' | 'variant'> {
  color?:
    | 'facebook'
    | 'twitter'
    | 'instagram'
    | 'linkedin'
    | 'pinterest'
    | 'youtube'
    | 'github'
    | 'vimeo'
    | 'slack'
    | 'dribbble'
    | 'reddit'
    | 'tumblr'
  size?: 'small' | 'medium' | 'large'
  circular?: boolean
  iconOnly?: boolean
  children?: ReactNode
  [key: string]: any
}

const MDSocialButton: FC<Props> = forwardRef(({ color, size, iconOnly, circular, children, ...rest }, ref) => (
  <MDSocialButtonRoot
    {...rest}
    ref={ref}
    variant='contained'
    color='primary'
    size={size}
    ownerState={{ color, size, iconOnly, circular }}
  >
    {children}
  </MDSocialButtonRoot>
))

// Setting default values for the props of MDSocialButton
MDSocialButton.defaultProps = {
  size: 'medium',
  color: 'facebook',
  iconOnly: false,
  circular: false,
}

export default MDSocialButton
