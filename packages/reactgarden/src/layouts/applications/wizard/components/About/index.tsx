// @mui material components
import Grid from "@mui/material/Grid"
import Icon from "@mui/material/Icon"
import Tooltip from "@mui/material/Tooltip"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDAvatar from "~/components/MDAvatar"
import MDButton from "~/components/MDButton"

// Wizard application components
import FormField from "~/layouts/applications/wizard/components/FormField"

// Images
import team2 from "~/assets/images/people/team-2.jpg"

function About(): JSX.Element {
  return (
    <MDBox>
      <MDBox width="82%" textAlign="center" mx="auto" my={4}>
        <MDBox mb={1}>
          <MDTypography variant="h5" fontWeight="regular">
            Let&apos;s start with the basic information
          </MDTypography>
        </MDBox>
        <MDTypography variant="body2" color="text">
          Let us know your name and email address. Use an address you don&apos;t
          mind other users contacting you at
        </MDTypography>
      </MDBox>
      <MDBox mt={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} container justifyContent="center">
            <MDBox position="relative" height="max-content" mx="auto">
              <MDAvatar
                src={team2}
                alt="profile picture"
                size="xxl"
                variant="rounded"
              />
              <MDBox
                alt="spotify logo"
                position="absolute"
                right={0}
                bottom={0}
                mr={-1}
                mb={-1}>
                <Tooltip title="Edit" placement="top">
                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    iconOnly>
                    <Icon>edit</Icon>
                  </MDButton>
                </Tooltip>
              </MDBox>
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={8}>
            <MDBox mb={2}>
              <FormField type="text" label="First Name" />
            </MDBox>
            <MDBox mb={2}>
              <FormField type="text" label="Last Name" />
            </MDBox>
            <MDBox>
              <FormField type="email" label="Email Address" />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default About
