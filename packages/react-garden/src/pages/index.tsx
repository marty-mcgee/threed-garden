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
import Footer from "~/components/elements/Footer"

/* EXAMPLE (WORDPRESS HEADLESS) */
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Link from "~/themes/theme-blog/Link"
import ProTip from "~/themes/theme-blog/ProTip"
import Copyright from "~/themes/theme-blog/Copyright"

const Home: NextPage = () => (
  <DashboardLayout>
    <DashboardNavbar />
    <MDBox py={3}>
      <Grid container>

        <Container maxWidth="lg">
          <Box
            sx={{
              my: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Typography component="h1" variant="h6" gutterBottom>
              ThreeD Garden for FarmBot + ThreeJS
            </Typography>
            {/*
            <Typography component="h2" variant="h4" gutterBottom>
              MUI v5 + Next.js with TypeScript
            </Typography>
            <Link href="/about" color="secondary">
              Click Here to Read More -- About Us
            </Link>
            <ProTip />
            <Copyright />
            */}
          </Box>
        </Container>

      </Grid>
    </MDBox>
    <Footer />
  </DashboardLayout>
)

export default Home
