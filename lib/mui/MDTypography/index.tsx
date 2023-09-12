import { FC, ReactNode, forwardRef } from 'react'

// @mui material components
import { TypographyProps } from '@mui/material'

// Custom styles for MDTypography
import MDTypographyRoot from '#/lib/mui/MDTypography/MDTypographyRoot'

// ThreeD Garden contexts
import { useMaterialUIController } from '#/lib/contexts/MaterialUIContext'

// Declaring props types for MDTypography
interface Props extends TypographyProps {
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'light'
    | 'dark'
    | 'text'
    | 'white'
  fontWeight?: 'light' | 'regular' | 'medium' | 'bold' | undefined
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'
  verticalAlign?: 'unset' | 'baseline' | 'sub' | 'super' | 'text-top' | 'text-bottom' | 'middle' | 'top' | 'bottom'
  textGradient?: boolean
  children: ReactNode
  opacity?: number
  [key: string]: any
}

const MDTypography: FC<Props | any> = forwardRef(
  ({ color, fontWeight, textTransform, verticalAlign, textGradient, opacity, children, ...rest }, ref) => {
    const [controller] = useMaterialUIController()
    const { darkMode } = controller

    return (
      <MDTypographyRoot
        {...rest}
        ref={ref}
        ownerState={{
          color,
          textTransform,
          verticalAlign,
          fontWeight,
          opacity,
          textGradient,
          darkMode,
        }}
      >
        {children}
      </MDTypographyRoot>
    )
  }
)

// Declaring default props for MDTypography
MDTypography.defaultProps = {
  color: 'dark',
  fontWeight: undefined,
  textTransform: 'none',
  verticalAlign: 'unset',
  textGradient: false,
  opacity: 1,
}

export default MDTypography
