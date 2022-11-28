import { ReactNode } from 'react'

// @mui material components
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Declaring prop types for DataTableBodyCell
interface Props {
  children: ReactNode
  noBorder?: boolean
  align?: 'left' | 'right' | 'center'
}

function DataTableBodyCell({ noBorder, align, children }: Props): JSX.Element {
  return (
    <MDBox
      component='td'
      textAlign={align}
      py={1.5}
      px={3}
      sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }: Theme) => ({
        fontSize: size.sm,
        borderBottom: noBorder ? 'none' : `${borderWidth[1]} solid ${light.main}`,
      })}
    >
      <MDBox
        display='inline-block'
        width='max-content'
        color='text'
        sx={{ verticalAlign: 'middle' }}
      >
        {children}
      </MDBox>
    </MDBox>
  )
}

// Declaring default props for DataTableBodyCell
DataTableBodyCell.defaultProps = {
  noBorder: false,
  align: 'left',
}

export default DataTableBodyCell
