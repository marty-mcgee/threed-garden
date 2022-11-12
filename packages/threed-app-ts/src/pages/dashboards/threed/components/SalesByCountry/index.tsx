import { useEffect } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// ThreeD Garden examples components
import SalesTable from '~/components/elements/Tables/SalesTable'

// Data
import salesTableData from '~/@fake-db/pages/dashboards/analytics/components/SalesByCountry/data/salesTableData'

function SalesByCountry(): JSX.Element {
  useEffect(() => {
    const mapContainer = document.getElementById('map')
    const jsVectorMap = require('jsvectormap')
    require('jsvectormap/dist/maps/world-merc.js')

    const createMap = () =>
      new jsVectorMap({
        selector: '#map',
        map: 'world_merc',
        zoomOnScroll: false,
        zoomButtons: false,
        selectedMarkers: [1, 3],
        markersSelectable: true,
        markers: [
          {
            name: 'USA',
            coords: [40.71296415909766, -74.00437720027804],
          },
          {
            name: 'Germany',
            coords: [51.17661451970939, 10.97947735117339],
          },
          {
            name: 'Brazil',
            coords: [-7.596735421549542, -54.781694323779185],
          },
          {
            name: 'Russia',
            coords: [62.318222797104276, 89.81564777631716],
          },
          {
            name: 'China',
            coords: [22.320178999475512, 114.17161225541399],
          },
        ],
        markerStyle: {
          initial: {
            fill: '#1A73E8',
          },
          hover: {
            fill: '#1A73E8',
          },
          selected: {
            fill: '#191919',
          },
        },
      })

    if (mapContainer && mapContainer.children.length === 0) createMap()
    ;() => mapContainer.children[0].remove()
  }, [])

  return (
    <Card sx={{ width: '100%' }}>
      <MDBox display='flex'>
        <MDBox
          display='flex'
          justifyContent='center'
          alignItems='center'
          width='4rem'
          height='4rem'
          variant='gradient'
          bgColor='success'
          color='white'
          shadow='md'
          borderRadius='xl'
          ml={3}
          mt={-2}
        >
          <Icon
            fontSize='medium'
            color='inherit'
          >
            language
          </Icon>
        </MDBox>
        <MDTypography
          variant='h6'
          sx={{ mt: 2, mb: 1, ml: 2 }}
        >
          Sales by Country
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <Grid container>
          <Grid
            item
            xs={12}
            md={7}
            lg={6}
          >
            <SalesTable
              rows={salesTableData}
              shadow={false}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={5}
            lg={6}
            sx={{ mt: { xs: 5, lg: 0 } }}
          >
            <MDBox
              id='map'
              width='100%'
              height='100%'
              mt={-3}
            />
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

export default SalesByCountry
