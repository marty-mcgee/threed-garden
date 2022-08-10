// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Autocomplete from "@mui/material/Autocomplete"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDInput from "components/MDInput"

// NewProduct page components
import FormField from "layouts/ecommerce/products/edit-product/components/FormField"

function Pricing(): JSX.Element {
  return (
    <Card sx={{ overflow: "visible" }}>
      <MDBox p={3}>
        <MDTypography variant="h5" fontWeight="bold">
          Pricing
        </MDTypography>
        <MDBox mt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormField type="number" label="Price" defaultValue="99.00" />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
              <Autocomplete
                defaultValue="USD"
                options={["BTC", "CNY", "EUR", "GBP", "INR", "USD"]}
                renderInput={(params) => (
                  <MDInput {...params} variant="standard" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormField type="text" label="SKU" defaultValue="71283476591" />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDBox my={2} display="inline-block">
                <MDTypography
                  component="label"
                  variant="button"
                  fontWeight="regular"
                  color="text">
                  Tags
                </MDTypography>
              </MDBox>
              <Autocomplete
                multiple
                defaultValue={["In Stock", "Out of Stock"]}
                options={[
                  "Black Friday",
                  "Expired",
                  "Out of Stock",
                  "In Stock",
                  "Sale",
                ]}
                renderInput={(params) => (
                  <MDInput {...params} variant="standard" />
                )}
              />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default Pricing
