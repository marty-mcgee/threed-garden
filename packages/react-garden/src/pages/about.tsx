import * as React from "react"
import type { NextPage } from "next"

// @mui material components
import Grid from "@mui/material/Grid"
import Tooltip from "@mui/material/Tooltip"
import Icon from "@mui/material/Icon"

// Material Dashboard 2 PRO React TS components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import PageLayout from "~/components/elements/LayoutContainers/PageLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"

/* EXAMPLE (WORDPRESS HEADLESS) */
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Link from "~/themes/theme-blog/Link"
import ProTip from "~/themes/theme-blog/ProTip"
import Copyright from "~/themes/theme-blog/Copyright"

const About: NextPage = () => (
  <DashboardLayout>
    <DashboardNavbar />
    <MDBox py={3}>
      <Grid container>

        <Container maxWidth="lg">
          <Box
            sx={{
              my: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Typography component="h1" variant="h3" gutterBottom>
              ThreeD Garden for FarmBot + ThreeJS
            </Typography>
            <Typography component="h2" variant="h4" gutterBottom>
              MUI v5 + Next.js with TypeScript
            </Typography>
            <Link href="/participate" color="secondary">
              Click Here to Participate in ThreeD Garden
            </Link>
            <ProTip />
            <Copyright />
          </Box>
        </Container>

      </Grid>
    </MDBox>
  </DashboardLayout>
)

export default About
