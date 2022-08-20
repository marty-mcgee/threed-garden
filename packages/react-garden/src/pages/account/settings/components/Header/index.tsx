import { useState } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Switch from "@mui/material/Switch"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDAvatar from "~/components/mui/MDAvatar"

// Images
import burceMars from "~/assets/images/people/bruce-mars.jpg"

function Header(): JSX.Element {
  const [visible, setVisible] = useState<boolean>(true)

  const handleSetVisible = () => setVisible(!visible)

  return (
    <Card id="profile">
      <MDBox p={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <MDAvatar
              src={burceMars}
              alt="profile-image"
              size="xl"
              shadow="sm"
            />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                Alex Thompson
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="medium">
                CEO / Co-Founder
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3} sx={{ ml: "auto" }}>
            <MDBox
              display="flex"
              justifyContent={{ md: "flex-end" }}
              alignItems="center"
              lineHeight={1}>
              <MDTypography variant="caption" fontWeight="regular">
                Switch to {visible ? "invisible" : "visible"}
              </MDTypography>
              <MDBox ml={1}>
                <Switch checked={visible} onChange={handleSetVisible} />
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

export default Header
