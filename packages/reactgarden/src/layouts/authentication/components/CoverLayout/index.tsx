import { ReactNode } from "react"

// @mui material components
import Grid from "@mui/material/Grid"
import { Theme } from "@mui/material/styles"

// Company Juice Dashboard components
import MDBox from "components/MDBox"

// Company Juice Dashboard examples components
import DefaultNavbar from "examples/Navbars/DefaultNavbar"
import PageLayout from "examples/LayoutContainers/PageLayout"

// Authentication layout components
import Footer from "layouts/authentication/components/Footer"

// Company Juice Dashboard page layout routes
import pageRoutes from "page.routes"

// Declaring props types for CoverLayout
interface Props {
  coverHeight?: string
  image: string
  children: ReactNode
}

function CoverLayout({ coverHeight, image, children }: Props): JSX.Element {
  return (
    <PageLayout>
      <DefaultNavbar
        routes={pageRoutes}
        action={{
          type: "external",
          route: "https://companyjuice.com/product/company-juice-dashboard",
          label: "buy now",
          color: "info",
        }}
        transparent
        light
      />
      <MDBox
        width="calc(100% - 2rem)"
        minHeight={coverHeight}
        borderRadius="xl"
        mx={2}
        my={2}
        pt={6}
        pb={28}
        sx={{
          backgroundImage: ({
            functions: { linearGradient, rgba },
            palette: { gradients },
          }: Theme) =>
            image &&
            `${linearGradient(
              rgba(gradients.dark.main, 0.4),
              rgba(gradients.dark.state, 0.4)
            )}, url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <MDBox mt={{ xs: -20, lg: -18 }} px={1} width="calc(100% - 2rem)" mx="auto">
        <Grid container spacing={1} justifyContent="center">
          <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
            {children}
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </PageLayout>
  )
}

// Declaring default props for CoverLayout
CoverLayout.defaultProps = {
  coverHeight: "35vh",
}

export default CoverLayout
