// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDButton from "~/components/mui/MDButton"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"

// EditProduct page components
import ProductImage from "~/pages/dashboards/ecommerce/products/edit-product/components/ProductImage"
import ProductInfo from "~/pages/dashboards/ecommerce/products/edit-product/components/ProductInfo"
import Socials from "~/pages/dashboards/ecommerce/products/edit-product/components/Socials"
import Pricing from "~/pages/dashboards/ecommerce/products/edit-product/components/Pricing"

function EditProduct(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mx={1}>
        <MDBox mb={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} lg={6}>
              <MDTypography variant="h4" fontWeight="medium">
                Make the changes below
              </MDTypography>
              <MDBox mt={1} mb={2}>
                <MDTypography variant="body2" color="text">
                  We’re constantly trying to express ourselves and actualize our
                  dreams. If you have the opportunity to play.
                </MDTypography>
              </MDBox>
            </Grid>
            <Grid item xs={12} lg={6}>
              <MDBox display="flex" justifyContent="flex-end">
                <MDButton variant="gradient" color="info">
                  save
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <ProductImage />
          </Grid>
          <Grid item xs={12} lg={8}>
            <ProductInfo />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Socials />
          </Grid>
          <Grid item xs={12} lg={8}>
            <Pricing />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default EditProduct
