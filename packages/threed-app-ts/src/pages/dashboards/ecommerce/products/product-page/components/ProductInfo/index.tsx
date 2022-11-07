// @mui material components
import Grid from "@mui/material/Grid"
import Icon from "@mui/material/Icon"
import Autocomplete from "@mui/material/Autocomplete"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDButton from "~/components/mui/MDButton"
import MDBadge from "~/components/mui/MDBadge"
import MDInput from "~/components/mui/MDInput"

function ProductInfo(): JSX.Element {
  return (
    <MDBox>
      <MDBox mb={1}>
        <MDTypography variant="h3" fontWeight="bold">
          Leather Couch Set
        </MDTypography>
      </MDBox>
      <MDTypography variant="h4" color="text">
        <Icon>star</Icon>
        <Icon>star</Icon>
        <Icon>star</Icon>
        <Icon>star</Icon>
        <Icon>star_half</Icon>
      </MDTypography>
      <MDBox mt={1}>
        <MDTypography variant="h6" fontWeight="medium">
          Price
        </MDTypography>
      </MDBox>
      <MDBox mb={1}>
        <MDTypography variant="h5" fontWeight="medium">
          $1,419
        </MDTypography>
      </MDBox>
      <MDBadge
        variant="contained"
        color="success"
        badgeContent="in stock"
        container
      />
      <MDBox mt={3} mb={1} ml={0.5}>
        <MDTypography variant="button" fontWeight="regular" color="text">
          Description
        </MDTypography>
      </MDBox>
      <MDBox component="ul" m={0} pl={4} mb={2}>
        <MDBox component="li" color="text" fontSize="1.25rem" lineHeight={1}>
          <MDTypography
            variant="body2"
            color="text"
            fontWeight="regular"
            verticalAlign="middle">
            The most beautiful curves of this swivel stool adds an elegant touch
            to any environment
          </MDTypography>
        </MDBox>
        <MDBox component="li" color="text" fontSize="1.25rem" lineHeight={1}>
          <MDTypography
            variant="body2"
            color="text"
            fontWeight="regular"
            verticalAlign="middle">
            Memory swivel seat returns to original seat position
          </MDTypography>
        </MDBox>
        <MDBox component="li" color="text" fontSize="1.25rem" lineHeight={1}>
          <MDTypography
            variant="body2"
            color="text"
            fontWeight="regular"
            verticalAlign="middle">
            Comfortable integrated layered chair seat cushion design
          </MDTypography>
        </MDBox>
        <MDBox component="li" color="text" fontSize="1.25rem" lineHeight={1}>
          <MDTypography
            variant="body2"
            color="text"
            fontWeight="regular"
            verticalAlign="middle">
            Fully assembled! No assembly required
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDBox mt={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <MDBox mb={1.5} lineHeight={0} display="inline-block">
              <MDTypography
                component="label"
                variant="button"
                color="text"
                fontWeight="regular">
                Frame Material
              </MDTypography>
            </MDBox>
            <Autocomplete
              defaultValue="Steel"
              options={["Aluminium", "Carbon", "Steel", "Wood"]}
              renderInput={(params) => (
                <MDInput {...params} variant="standard" />
              )}
            />
          </Grid>
          <Grid item xs={12} lg={5}>
            <MDBox mb={1.5} lineHeight={0} display="inline-block">
              <MDTypography
                component="label"
                variant="button"
                color="text"
                fontWeight="regular">
                Color
              </MDTypography>
            </MDBox>
            <Autocomplete
              defaultValue="White"
              options={["Black", "Blue", "Grey", "Pink", "Red", "White"]}
              renderInput={(params) => (
                <MDInput {...params} variant="standard" />
              )}
            />
          </Grid>
          <Grid item xs={12} lg={2}>
            <MDBox mb={1.5} lineHeight={0} display="inline-block">
              <MDTypography
                component="label"
                variant="button"
                color="text"
                fontWeight="regular">
                Quantity
              </MDTypography>
            </MDBox>
            <MDInput
              inputProps={{ type: "number" }}
              defaultValue={1}
              variant="standard"
            />
          </Grid>
        </Grid>
      </MDBox>
      <MDBox mt={3}>
        <Grid item xs={12} lg={5} container>
          <MDButton variant="gradient" color="info" fullWidth>
            add to cart
          </MDButton>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default ProductInfo
