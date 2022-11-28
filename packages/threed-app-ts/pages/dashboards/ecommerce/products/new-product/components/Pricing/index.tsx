// @mui material components
import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDInput from '~/components/mui/MDInput'

// NewProduct page components
import FormField from '#/pages/dashboards/ecommerce/products/new-product/components/FormField'

function Pricing(): JSX.Element {
  return (
    <MDBox>
      <MDTypography variant='h5'>Pricing</MDTypography>
      <MDBox mt={3}>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            sm={3}
          >
            <FormField
              type='text'
              label='Price'
              placeholder='99.00'
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={4}
            sx={{ mt: 2 }}
          >
            <Autocomplete
              defaultValue='USD'
              options={['BTC', 'CNY', 'EUR', 'GBP', 'INR', 'USD']}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  variant='standard'
                />
              )}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={5}
          >
            <FormField
              type='text'
              label='SKU'
              placeholder='71283476591'
            />
          </Grid>
        </Grid>
      </MDBox>
      <MDBox mt={1}>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
          >
            <MDBox
              my={2}
              display='inline-block'
            >
              <MDTypography
                component='label'
                variant='button'
                fontWeight='regular'
                color='text'
              >
                Tags
              </MDTypography>
            </MDBox>
            <Autocomplete
              multiple
              defaultValue={['In Stock', 'Out of Stock']}
              options={['Black Friday', 'Expired', 'Out of Stock', 'In Stock', 'Sale']}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  variant='standard'
                />
              )}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default Pricing
