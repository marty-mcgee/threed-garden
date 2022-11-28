import { FC, ReactNode, forwardRef } from 'react'

// @mui material components
import { BadgeProps } from '@mui/material'

// Custom styles for the MDBadge
import MDBadgeRoot from '#/lib/mui/MDBadge/MDBadgeRoot'

// declaring props types for MDBadge
interface Props extends Omit<BadgeProps, 'color' | 'variant'> {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark'
  variant?: 'gradient' | 'contained'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  circular?: boolean
  indicator?: boolean
  border?: boolean
  children?: ReactNode
  container?: boolean
  [key: string]: any
}

const MDBadge: FC<Props | any> = forwardRef(
  ({ color, variant, size, circular, indicator, border, container, children, ...rest }, ref) => (
    <MDBadgeRoot
      {...rest}
      ownerState={{
        color,
        variant,
        size,
        circular,
        indicator,
        border,
        container,
        children,
      }}
      ref={ref}
      color='default'
    >
      {children}
    </MDBadgeRoot>
  )
)

// declaring default props for MDBadge
MDBadge.defaultProps = {
  color: 'info',
  variant: 'gradient',
  size: 'sm',
  circular: false,
  indicator: false,
  border: false,
  container: false,
  children: false,
}

export default MDBadge
