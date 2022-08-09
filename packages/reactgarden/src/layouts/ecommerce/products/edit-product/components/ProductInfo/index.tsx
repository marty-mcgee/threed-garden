import { useState } from "react"

// @mui material components
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Autocomplete from "@mui/material/Autocomplete"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDEditor from "components/MDEditor"
import MDInput from "components/MDInput"

// NewProduct page components
import FormField from "layouts/ecommerce/products/edit-product/components/FormField"

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
        <MDBox mt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField type="text" label="Name" defaultValue="Minimal Bar Stool" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField type="number" label="Weight" defaultValue={2} />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormField type="text" label="Collection" defaultValue="Summer" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormField type="text" label="Price" defaultValue="$90" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormField type="number" label="Quantity" defaultValue={50} />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <MDBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
                <MDTypography component="label" variant="button" fontWeight="regular" color="text">
                  Description&nbsp;&nbsp;
                  <MDTypography variant="caption" fontWeight="regular" color="text">
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
                    textTransform="capitalize"
                  >
                    Category
                  </MDTypography>
                </MDBox>
                <Autocomplete
                  defaultValue="Clothing"
                  options={["Clothing", "Electronics", "Furniture", "Others", "Real Estate"]}
                  renderInput={(params) => <MDInput {...params} variant="standard" />}
                />
              </MDBox>
              <MDBox mb={1.625} display="inline-block">
                <MDTypography
                  component="label"
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  textTransform="capitalize"
                >
                  Color
                </MDTypography>
              </MDBox>
              <Autocomplete
                defaultValue="Black"
                options={["Black", "Blue", "Green", "Orange", "White"]}
                renderInput={(params) => <MDInput {...params} variant="standard" />}
              />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default ProductInfo
