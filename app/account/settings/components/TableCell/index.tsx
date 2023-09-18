import { ReactNode } from 'react'

// @mui material components
import type { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Declaring props types for TableCell
interface Props {
  width?: string
  children: ReactNode
  align?: string | any
  padding?: number[]
  noBorder?: boolean
}

function TableCell({ width, align, padding, noBorder, children }: Props): JSX.Element {
  return (
    <MDBox
      component='th'
      width={width}
      pt={padding[0]}
      pr={padding[1]}
      pb={padding[2]}
      pl={padding[3]}
      textAlign={align}
      sx={{
        border: ({ borders: { borderWidth }, palette: { light } }: Theme) =>
          noBorder ? 0 : `${borderWidth[1]} solid ${light.main}`,
      }}
    >
      <MDTypography
        component='div'
        variant='body2'
        color='text'
      >
        {children}
      </MDTypography>
    </MDBox>
  )
}

// Declaring default props for TableCell
TableCell.defaultProps = {
  width: 'auto',
  align: 'left',
  padding: [],
  noBorder: false,
}

export default TableCell
