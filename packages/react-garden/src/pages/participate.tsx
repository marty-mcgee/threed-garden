// import * as React from "react"
import type { NextPage } from "next"

// @mui material components
import Grid from "@mui/material/Grid"
// import Tooltip from "@mui/material/Tooltip"
// import Icon from "@mui/material/Icon"

// Material Dashboard 2 PRO React TS components
import MDBox from "~/components/mui/MDBox"
// import MDTypography from "~/components/mui/MDTypography"

import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"

import ThreeDGarden from "~/components/threed/ThreeDGarden"

const Participate: NextPage = () => (
  <DashboardLayout>
    <DashboardNavbar />
    <MDBox>
      <Grid container
        sx={{
          my: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {/* HEY HEY HEY */}
        <ThreeDGarden />
      </Grid>
    </MDBox>
    <Footer />
  </DashboardLayout>
)

export default Participate
