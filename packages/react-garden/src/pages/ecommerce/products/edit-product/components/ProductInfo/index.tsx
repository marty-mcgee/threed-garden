import { useState } from "react"

// @mui material components
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Autocomplete from "@mui/material/Autocomplete"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDEditor from "~/components/mui/MDEditor"
import MDInput from "~/components/mui/MDInput"

// NewProduct page components
import FormField from "~/pages/ecommerce/products/edit-product/components/FormField"

function ProductInfo(): JSX.Element {
  const [editorValue, setEditorValue] = useState<string>(
    `<p>
      Long sleeves black denim jacket with a twisted design. Contrast stitching. Button up closure. White arrow prints on the back.
    </p>`
  )

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5">Product Information</MDTypography>
        <MDBox mt={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField
                type="text"
                label="Name"
                defaultValue="Leather Couch"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField type="number" label="Weight (kg)" defaultValue={220} />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormField type="text" label="Collection" defaultValue="Winter" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormField type="text" label="Price" defaultValue="$900" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormField type="number" label="Quantity" defaultValue={5} />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MDBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
                <MDTypography
                  component="label"
                  variant="button"
                  fontWeight="regular"
                  color="text">
                  Description&nbsp;&nbsp;
                  <MDTypography
                    variant="caption"
                    fontWeight="regular"
                    color="text">
                    (optional)
                  </MDTypography>
                </MDTypography>
              </MDBox>
              <MDEditor value={editorValue} onChange={setEditorValue} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MDBox mb={3}>
                <MDBox mb={1.625} display="inline-block">
                  <MDTypography
                    component="label"
                    variant="button"
                    fontWeight="regular"
                    color="text"
                    textTransform="capitalize">
                    Category
                  </MDTypography>
                </MDBox>
                <Autocomplete
                  defaultValue="Furniture"
                  options={[
                    "Clothing",
                    "Electronics",
                    "Furniture",
                    "Others",
                    "Real Estate",
                  ]}
                  renderInput={(params) => (
                    <MDInput {...params} variant="standard" />
                  )}
                />
              </MDBox>
              <MDBox mb={1.625} display="inline-block">
                <MDTypography
                  component="label"
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  textTransform="capitalize">
                  Color
                </MDTypography>
              </MDBox>
              <Autocomplete
                defaultValue="Brown"
                options={["Black", "Brown", "Blue", "Green", "Orange", "White"]}
                renderInput={(params) => (
                  <MDInput {...params} variant="standard" />
                )}
              />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default ProductInfo
