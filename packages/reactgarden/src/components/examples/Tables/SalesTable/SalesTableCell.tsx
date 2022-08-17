// @mui material components
import TableCell from "@mui/material/TableCell"

// ThreeD Garden components
import MDTypography from "~/components/MDTypography"
import MDBox from "~/components/MDBox"

// Declaring prop types for SalesTableCell
interface Props {
  title: string
  content?: string | number
  image?: string
  noBorder?: boolean
  [key: string]: any
}

function SalesTableCell({
  title,
  content,
  image,
  noBorder,
  ...rest
}: Props): JSX.Element {
  let template

  if (image) {
    template = (
      <TableCell
        {...rest}
        align="left"
        width="30%"
        sx={{ border: noBorder && 0 }}>
        <MDBox display="flex" alignItems="center" width="max-content">
          <MDBox
            component="img"
            src={image}
            alt={content.toString()}
            width="1.5rem"
            height="auto"
          />{" "}
          <MDBox display="flex" flexDirection="column" ml={3}>
            <MDTypography
              variant="caption"
              color="text"
              fontWeight="medium"
              textTransform="capitalize">
              {title}:
            </MDTypography>
            <MDTypography
              variant="button"
              fontWeight="regular"
              textTransform="capitalize">
              {content}
            </MDTypography>
          </MDBox>
        </MDBox>
      </TableCell>
    )
  } else {
    template = (
      <TableCell {...rest} align="center" sx={{ border: noBorder && 0 }}>
        <MDBox display="flex" flexDirection="column">
          <MDTypography
            variant="caption"
            color="text"
            fontWeight="medium"
            textTransform="capitalize">
            {title}:
          </MDTypography>
          <MDTypography
            variant="button"
            fontWeight="regular"
            textTransform="capitalize">
            {content}
          </MDTypography>
        </MDBox>
      </TableCell>
    )
  }

  return template
}

// Declaring default props for SalesTableCell
SalesTableCell.defaultProps = {
  image: "",
  noBorder: false,
}

export default SalesTableCell
