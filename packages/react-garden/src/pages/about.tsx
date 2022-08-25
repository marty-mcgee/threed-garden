// import * as React from "react"
import type { NextPage } from "next"
import Link from "next/link"

// @mui material components
// import Grid from "@mui/material/Grid"
// import Tooltip from "@mui/material/Tooltip"
// import Icon from "@mui/material/Icon"

// Material Dashboard 2 PRO React TS components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"

/* EXAMPLE (WORDPRESS HEADLESS) */
// import Container from "@mui/material/Container"
// import Typography from "@mui/material/Typography"
// import Box from "@mui/material/Box"
// import MuiLink from "@mui/material/Link"
// import Link from "~/themes/theme-blog/Link"
// import ProTip from "~/themes/theme-blog/ProTip"
// import Copyright from "~/themes/theme-blog/Copyright"

const About: NextPage = () => (
  <DashboardLayout>
    <DashboardNavbar />
    <MDBox
      sx={{
        my: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}>
      <MDTypography component="h1" variant="h5" gutterBottom>
        ThreeD Garden for FarmBot + ThreeJS
      </MDTypography>
      <MDTypography component="h2" variant="h6" gutterBottom>
        MUI v5 + Next.js with TypeScript
      </MDTypography>
      {/* <Link href="/participate" color="success">
        -&gt; Click Here to Participate in ThreeD Garden &lt;-
      </Link> */}
      {/*
      <Link href="/about" color="secondary">
        Click Here to Read More -- About Us
      </Link>
      <ProTip />
      <Copyright />
      */}
    </MDBox>
    <Footer />
  </DashboardLayout>
)

export default About
