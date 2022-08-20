/* TARGET (goes in _app.tsx)
import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"
import App from "App"

// Material UI Context Provider
import { MaterialUIControllerProvider } from "~/context"

ReactDOM.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>,
  document.getElementById("root")
)
*/

/* EXAMPLE (WORDPRESS HEADLESS) */
import * as React from "react"
import type { NextPage } from "next"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Link from "~/themes/theme-example/Link"
import ProTip from "~/themes/theme-example/ProTip"
import Copyright from "~/themes/theme-example/Copyright"

const Home: NextPage = () => (
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
      <Link href="/about" color="secondary">
        Click Here to Read More -- About Us
      </Link>
      <ProTip />
      <Copyright />
    </Box>
  </Container>
)

export default Home
/**/
