// @mui material components
import Grid from "@mui/material/Grid"

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook"
import TwitterIcon from "@mui/icons-material/Twitter"
import InstagramIcon from "@mui/icons-material/Instagram"
import PinterestIcon from "@mui/icons-material/Pinterest"
import LinkedInIcon from "@mui/icons-material/LinkedIn"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

function Footer(): JSX.Element {
  return (
    <MDBox component="footer" py={6}>
      <Grid container justifyContent="center">
        <Grid item xs={10} lg={8}>
          <MDBox display="flex" justifyContent="center" flexWrap="wrap" mb={3}>
            <MDBox mr={{ xs: 2, lg: 3, xl: 6 }}>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                Company
              </MDTypography>
            </MDBox>
            <MDBox mr={{ xs: 2, lg: 3, xl: 6 }}>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                About Us
              </MDTypography>
            </MDBox>
            <MDBox mr={{ xs: 0, lg: 3, xl: 6 }}>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                Team
              </MDTypography>
            </MDBox>
            <MDBox mr={{ xs: 2, lg: 3, xl: 6 }}>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                Product
              </MDTypography>
            </MDBox>
            <MDBox mr={{ xs: 2, lg: 3, xl: 6 }}>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                Blog
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography
                component="a"
                href="#"
                variant="body2"
                fontWeight="regular"
                color="secondary">
                Pricing
              </MDTypography>
            </MDBox>
          </MDBox>
        </Grid>
        <Grid item xs={12} lg={8}>
          <MDBox display="flex" justifyContent="center" mt={1} mb={3}>
            <MDBox mr={3} color="secondary">
              <FacebookIcon fontSize="small" />
            </MDBox>
            <MDBox mr={3} color="secondary">
              <TwitterIcon fontSize="small" />
            </MDBox>
            <MDBox mr={3} color="secondary">
              <InstagramIcon fontSize="small" />
            </MDBox>
            <MDBox mr={3} color="secondary">
              <PinterestIcon fontSize="small" />
            </MDBox>
            <MDBox color="secondary">
              <LinkedInIcon fontSize="small" />
            </MDBox>
          </MDBox>
        </Grid>
        <Grid item xs={12} lg={8} sx={{ textAlign: "center" }}>
          <MDTypography variant="body2" color="secondary">
            Copyright &copy; 2022 Company Juice.
          </MDTypography>
        </Grid>
      </Grid>
    </MDBox>
  )
}

export default Footer
