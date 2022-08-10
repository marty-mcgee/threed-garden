// @mui material components
import Card from "@mui/material/Card"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDBadge from "components/MDBadge"

function FullBody(): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        pt={3}
        mb={2}
        px={3}>
        <MDTypography variant="body2" color="text">
          Full Body
        </MDTypography>
        <MDBadge
          variant="contained"
          color="info"
          badgeContent="moderate"
          container
        />
      </MDBox>
      <MDBox pb={3} px={3}>
        <MDTypography variant="body2" color="text">
          What matters is the people who are sparked by it. And the people who
          are liked.
        </MDTypography>
      </MDBox>
    </Card>
  )
}

export default FullBody
