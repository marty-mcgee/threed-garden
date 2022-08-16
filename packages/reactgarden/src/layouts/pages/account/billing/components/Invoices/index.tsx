// @mui material components
import Card from "@mui/material/Card"

// Company Juice Dashboard components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDButton from "~/components/MDButton"

// Billing page components
import Invoice from "~/layouts/pages/account/billing/components/Invoice"

function Invoices(): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox
        pt={2}
        px={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center">
        <MDTypography variant="h6" fontWeight="medium">
          Invoices
        </MDTypography>
        <MDButton variant="outlined" color="info" size="small">
          view all
        </MDButton>
      </MDBox>
      <MDBox p={2}>
        <MDBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
          <Invoice date="March, 01, 2022" id="#MS-415646" price="$180" />
          <Invoice date="February, 10, 2022" id="#RV-126749" price="$250" />
          <Invoice date="April, 05, 2022" id="#QW-103578" price="$120" />
          <Invoice date="June, 25, 2019" id="#MS-415646" price="$180" />
          <Invoice
            date="March, 01, 2019"
            id="#AR-803481"
            price="$300"
            noGutter
          />
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default Invoices
