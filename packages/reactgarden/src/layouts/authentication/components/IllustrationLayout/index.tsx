import { ReactNode } from "react"

// @mui material components
import Grid from "@mui/material/Grid"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Company Juice Dashboard examples components
import DefaultNavbar from "examples/Navbars/DefaultNavbar"
import PageLayout from "examples/LayoutContainers/PageLayout"

// Company Juice Dashboard page layout routes
import pageRoutes from "page.routes"

// Company Juice Dashboard context
import { useMaterialUIController } from "context"

// Declaring props types for IllustrationLayout
interface Props {
  header?: ReactNode
  title?: string
  description?: string
  children: ReactNode
  illustration?: string
}

function IllustrationLayout({
  header,
  title,
  description,
  illustration,
  children,
}: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <PageLayout background="white">
      <DefaultNavbar
        routes={pageRoutes}
        action={{
          type: "external",
          route: "https://companyjuice.com/product/company-juice-dashboard",
          label: "buy now",
          color: "info",
        }}
      />
      <Grid
        container
        sx={{
          backgroundColor: ({ palette: { background, white } }) =>
            darkMode ? background.default : white.main,
        }}
      >
        <Grid item xs={12} lg={6}>
          <MDBox
            display={{ xs: "none", lg: "flex" }}
            width="calc(100% - 2rem)"
            height="calc(100vh - 2rem)"
            borderRadius="lg"
            ml={2}
            mt={2}
            sx={{ backgroundImage: `url(${illustration})` }}
          />
        </Grid>
        <Grid item xs={11} sm={8} md={6} lg={4} xl={3} sx={{ mx: "auto" }}>
          <MDBox display="flex" flexDirection="column" justifyContent="center" height="100vh">
            <MDBox py={3} px={3} textAlign="center">
              {!header ? (
                <>
                  <MDBox mb={1} textAlign="center">
                    <MDTypography variant="h4" fontWeight="bold">
                      {title}
                    </MDTypography>
                  </MDBox>
                  <MDTypography variant="body2" color="text">
                    {description}
                  </MDTypography>
                </>
              ) : (
                header
              )}
            </MDBox>
            <MDBox p={3}>{children}</MDBox>
          </MDBox>
        </Grid>
      </Grid>
    </PageLayout>
  )
}

// Declaring default props for IllustrationLayout
IllustrationLayout.defaultProps = {
  header: "",
  title: "",
  description: "",
  illustration: "",
}

export default IllustrationLayout
