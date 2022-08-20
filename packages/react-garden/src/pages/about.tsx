import * as React from "react"
import type { NextPage } from "next"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ThemeExampleLink from "~/themes/theme-example/Link"
import ProTip from "~/themes/theme-example/ProTip"
import Copyright from "~/themes/theme-example/Copyright"

const About: NextPage = () => (
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
      <ThemeExampleLink href="/participate" color="primary">
        Click Here to Participate -- ThreeD Garden
      </ThemeExampleLink>
      <Box maxWidth="sm">
        <Button component={ThemeExampleLink} variant="contained" noLinkStyle href="/">
          Go to Home page
        </Button>
      </Box>
      <ProTip />
      <Copyright />
    </Box>
  </Container>
)

export default About
