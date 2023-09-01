import { ReactNode } from 'react'

// ThreeD Garden components
import MDTypography from '#/lib/mui/MDTypography'

function DefaultCell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <MDTypography
      variant='button'
      color='secondary'
    >
      {children}
    </MDTypography>
  )
}

export default DefaultCell
