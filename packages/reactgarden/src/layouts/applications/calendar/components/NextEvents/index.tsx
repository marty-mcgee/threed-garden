// @mui material components
import Card from "@mui/material/Card"

// Company Juice Dashboard components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// Company Juice Dashboard examples components
import DefaultItem from "~/examples/Items/DefaultItem"

function NextEvents(): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={2} px={2}>
        <MDTypography variant="h6" fontWeight="medium">
          Next events
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <DefaultItem
          color="dark"
          icon="paid"
          title="Cyber Week"
          description="27 March 2022, at 12:30 PM"
        />
        <MDBox mt={3.5}>
          <DefaultItem
            color="dark"
            icon="notifications"
            title="Meeting with Marry"
            description="24 March 2022, at 10:00 PM"
          />
        </MDBox>
        <MDBox mt={3.5}>
          <DefaultItem
            color="dark"
            icon="menu_book"
            title="Book Deposit Hall"
            description="25 March 2022, at 9:30 AM"
          />
        </MDBox>
        <MDBox mt={3.5}>
          <DefaultItem
            color="dark"
            icon="local_shipping"
            title="Shipment Deal UK"
            description="25 March 2022, at 2:00 PM"
          />
        </MDBox>
        <MDBox mt={3.5}>
          <DefaultItem
            color="dark"
            icon="palette"
            title="Verify Dashboard Color Palette"
            description="26 March 2022, at 9:00 AM"
          />
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default NextEvents
