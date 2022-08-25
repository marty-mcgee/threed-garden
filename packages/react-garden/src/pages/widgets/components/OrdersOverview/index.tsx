// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// ThreeD Garden examples components
import TimelineItem from "~/components/elements/Timeline/TimelineItem"

function OrdersOverview(): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={3} px={3}>
        <MDTypography variant="h6" fontWeight="medium">
          Orders Overview
        </MDTypography>
        <MDBox mt={0} mb={2}>
          <MDTypography variant="button" color="text" fontWeight="regular">
            <MDTypography
              display="inline"
              variant="body2"
              verticalAlign="middle">
              <Icon sx={{ color: ({ palette: { success } }) => success.main }}>
                arrow_upward
              </Icon>
            </MDTypography>
            &nbsp;
            <MDTypography variant="button" color="text" fontWeight="medium">
              24%
            </MDTypography>{" "}
            this month
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDBox p={2}>
        <TimelineItem
          color="success"
          icon="notifications"
          title="$2400, Design Changes"
          dateTime="22 AUG @ 7:20 PM"
        />
        <TimelineItem
          color="error"
          icon="inventory_2"
          title="New Order #1832412"
          dateTime="21 AUG @ 11:00 PM"
        />
        <TimelineItem
          color="info"
          icon="shopping_cart"
          title="Server payments for April"
          dateTime="21 AUG @ 9:34 PM"
        />
        <TimelineItem
          color="warning"
          icon="payment"
          title="New card added for order #4395133"
          dateTime="20 AUG @ 2:20 AM"
        />
        <TimelineItem
          color="primary"
          icon="vpn_key"
          title="New card added for order #4395133"
          dateTime="18 AUG @ 4:54 AM"
          lastItem
        />
      </MDBox>
    </Card>
  )
}

export default OrdersOverview
