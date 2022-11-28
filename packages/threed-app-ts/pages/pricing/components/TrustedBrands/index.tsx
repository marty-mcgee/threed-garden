// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Images
import coinbase from '#/lib/assets/images/logos/gray-logos/logo-coinbase.svg'
import nasa from '#/lib/assets/images/logos/gray-logos/logo-nasa.svg'
import netflix from '#/lib/assets/images/logos/gray-logos/logo-netflix.svg'
import pinterest from '#/lib/assets/images/logos/gray-logos/logo-pinterest.svg'
import spotify from '#/lib/assets/images/logos/gray-logos/logo-spotify.svg'
import vodafone from '#/lib/assets/images/logos/gray-logos/logo-vodafone.svg'

function PricingCards(): JSX.Element {
  return (
    <MDBox mt={8}>
      <MDBox textAlign='center'>
        <MDTypography
          variant='h6'
          opacity={0.5}
        >
          More than 50+ brands trust Material
        </MDTypography>
      </MDBox>
      <MDBox
        mt={5}
        ml={{ xs: 0, lg: -8 }}
      >
        <Grid
          container
          spacing={4}
        >
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={coinbase}
              alt='coinbase'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={nasa}
              alt='nasa'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={netflix}
              alt='netflix'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={pinterest}
              alt='pinterest'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={spotify}
              alt='spotify'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            lg={2}
          >
            <MDBox
              component='img'
              src={vodafone}
              alt='vodafone'
              width={{ xs: '100%', xl: '125%' }}
              opacity={0.9}
              mb={3}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default PricingCards
