// @mui material components
import Grid from "@mui/material/Grid"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"
import MDAvatar from "components/MDAvatar"
import MDBadge from "components/MDBadge"

// Images
import orderImage from "assets/images/products/product-12.jpg"

function OrderInfo(): JSX.Element {
  return (
    <Grid container spacing={3} alignItems="center">
      <Grid item xs={12} md={6}>
        <MDBox display="flex" alignItems="center">
          <MDBox mr={2}>
            <MDAvatar size="xxl" src={orderImage} alt="Gold Glasses" />
          </MDBox>
          <MDBox lineHeight={1}>
            <MDTypography variant="h6" fontWeight="medium">
              Gold Glasses
            </MDTypography>
            <MDBox mb={2}>
              <MDTypography variant="button" color="text">
                Order was delivered 2 days ago.
              </MDTypography>
            </MDBox>
            <MDBadge
              variant="gradient"
              color="success"
              size="xs"
              badgeContent="delivered"
              container
            />
          </MDBox>
        </MDBox>
      </Grid>
      <Grid item xs={12} md={6} sx={{ textAlign: "right" }}>
        <MDButton variant="gradient" color="dark" size="small">
          contact us
        </MDButton>
        <MDBox mt={0.5}>
          <MDTypography variant="button" color="text">
            Do you like the product? Leave us a review{" "}
            <MDTypography component="a" href="#" variant="button" color="text" fontWeight="regular">
              here
            </MDTypography>
            .
          </MDTypography>
        </MDBox>
      </Grid>
    </Grid>
  )
}

export default OrderInfo
