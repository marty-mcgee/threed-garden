// @mui material components
import Grid from "@mui/material/Grid"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Wizard application components
import FormField from "layouts/applications/wizard/components/FormField"

function Address(): JSX.Element {
  return (
    <MDBox>
      <MDBox width="80%" textAlign="center" mx="auto" my={4}>
        <MDBox mb={1}>
          <MDTypography variant="h5" fontWeight="regular">
            Are you living in a nice area?
          </MDTypography>
        </MDBox>
        <MDTypography variant="body2" color="text">
          One thing I love about the later sunsets is the chance to go for a
          walk through the neighborhood woods before dinner
        </MDTypography>
      </MDBox>
      <MDBox mt={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <FormField
              type="text"
              label="Street Name"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormField
              type="number"
              label="Street Number"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <FormField
              type="text"
              label="City"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormField
              type="text"
              label="Country"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default Address
