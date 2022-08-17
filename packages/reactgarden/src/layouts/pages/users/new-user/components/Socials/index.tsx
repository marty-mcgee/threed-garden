// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// NewUser page components
import FormField from "~/layouts/pages/users/new-user/components/FormField"

function Socials({ formData }: any): JSX.Element {
  const { formField, values, errors, touched } = formData
  const { twitter, facebook, instagram } = formField
  const {
    twitter: twitterV,
    facebook: facebookV,
    instagram: instagramV,
  } = values

  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Socials
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <FormField
              type={twitter.type}
              label={twitter.label}
              name={twitter.name}
              value={twitterV}
              placeholder={twitter.placeholder}
              error={errors.twitter && touched.twitter}
              success={twitterV.length > 0 && !errors.twitter}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type={facebook.type}
              label={facebook.label}
              name={facebook.name}
              value={facebookV}
              placeholder={facebook.placeholder}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type={instagram.type}
              label={instagram.label}
              name={instagram.name}
              value={instagramV}
              placeholder={instagram.placeholder}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default Socials
