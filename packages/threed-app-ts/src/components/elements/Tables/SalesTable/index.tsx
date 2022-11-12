import { useMemo } from 'react'

// @mui material components
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// ThreeD Garden components
import MDTypography from '~/components/mui/MDTypography'
import MDBox from '~/components/mui/MDBox'

// ThreeD Garden examples components
import SalesTableCell from '~/components/elements/Tables/SalesTable/SalesTableCell'

import { StaticImageData } from 'next/future/image'

// Declaring props types for SalesTable
interface Props {
  title?: string
  rows?: {
    [key: string]: string | StaticImageData | number | (string | StaticImageData | number)[]
  }[]
  shadow?: boolean
}

function SalesTable({ title, rows, shadow }: Props): JSX.Element {
  const renderTableCells = rows.map(
    (row: { [key: string]: string | StaticImageData | number | (string | StaticImageData | number)[] }, key: any) => {
      const tableRows: any = []
      const rowKey = `row-${key}`

      Object.entries(row).map(([cellTitle, cellContent]: any) =>
        Array.isArray(cellContent)
          ? tableRows.push(
              <SalesTableCell
                key={cellContent[1]}
                title={cellTitle}
                content={cellContent[1]}
                image={cellContent[0]}
                noBorder={key === rows.length - 1}
              />
            )
          : tableRows.push(
              <SalesTableCell
                key={cellContent}
                title={cellTitle}
                content={cellContent}
                noBorder={key === rows.length - 1}
              />
            )
      )

      return <TableRow key={rowKey}>{tableRows}</TableRow>
    }
  )

  return (
    <TableContainer sx={{ height: '100%', boxShadow: !shadow && 'none' }}>
      <Table>
        {title ? (
          <TableHead>
            <MDBox
              component='tr'
              width='max-content'
              display='block'
              mb={1.5}
            >
              <MDTypography
                variant='h6'
                component='td'
              >
                {title}
              </MDTypography>
            </MDBox>
          </TableHead>
        ) : null}
        <TableBody>{useMemo(() => renderTableCells, [rows])}</TableBody>
      </Table>
    </TableContainer>
  )
}

// Declaring default props for SalesTable
SalesTable.defaultProps = {
  title: '',
  rows: [{}],
  shadow: true,
}

export default SalesTable
