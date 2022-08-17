import { ReactNode } from "react"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// Declaring props types for TableCell
interface Props {
  width?: string
  children: ReactNode
  align?: string | any
  padding?: number[]
  noBorder?: boolean
}

function TableCell({
  width,
  align,
  padding,
  noBorder,
  children,
}: Props): JSX.Element {
  return (
    <MDBox
      component="th"
      width={width}
      pt={padding[0]}
      pr={padding[1]}
      pb={padding[2]}
      pl={padding[3]}
      textAlign={align}
      sx={{
        border: ({ borders: { borderWidth }, palette: { light } }) =>
          noBorder ? 0 : `${borderWidth[1]} solid ${light.main}`,
      }}>
      <MDTypography component="div" variant="body2" color="text">
        {children}
      </MDTypography>
    </MDBox>
  )
}

// Declaring default props for TableCell
TableCell.defaultProps = {
  width: "auto",
  align: "left",
  padding: [],
  noBorder: false,
}

export default TableCell
