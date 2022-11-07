// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// NewUser page components
import FormField from "~/pages/users/new-user/components/FormField"

function Profile({ formData }: any): JSX.Element {
  const { formField, values } = formData
  const { publicEmail, bio } = formField
  const { publicEmail: publicEmailV, bio: bioV } = values

  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Profile
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <FormField
              type={publicEmail.type}
              label={publicEmail.label}
              name={publicEmail.name}
              value={publicEmailV}
              placeholder={publicEmail.placeholder}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type={bio.type}
              label={bio.label}
              name={bio.name}
              value={bioV}
              placeholder={bio.placeholder}
              multiline
              rows={5}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default Profile
