// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// EditProduct page components
import FormField from "~/pages/layouts/ecommerce/products/edit-product/components/FormField"

function Socials(): JSX.Element {
  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5" fontWeight="bold">
          Socials
        </MDTypography>
        <MDBox mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormField
                type="text"
                label="Shoppify Handle"
                defaultValue="@soft"
              />
            </Grid>
            <Grid item xs={12}>
              <FormField
                type="text"
                label="Facebook Account"
                defaultValue="https://..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormField
                type="text"
                label="Instagram Account"
                defaultValue="https://..."
              />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default Socials
