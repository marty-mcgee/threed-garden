import { ReactNode } from 'react'

// @mui material components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import AppBar from '@mui/material/AppBar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden examples components
import DefaultNavbar from '#/lib/components/elements/Navbars/DefaultNavbar'

// ThreeD Garden page layout routes
import pageRoutes from '~/routes/page.routes'

// Images
import bgImage from '#/lib/assets/images/any/bg-pricing.jpg'

// Declaring props types for Header
interface Props {
  tabValue: number
  tabHandler: (...arg: any) => void
  children: ReactNode
}

function Header({ tabValue, tabHandler, children }: Props): JSX.Element {
  return (
    <>
      <DefaultNavbar
        routes={pageRoutes}
        action={{
          type: 'external',
          route: 'https://github.com/marty-mcgee/threed-garden',
          label: 'download now',
          color: 'light',
        }}
        transparent
        light
      />
      <MDBox
        position='relative'
        minHeight='50vh'
        height='50vh'
        borderRadius='xl'
        m={2}
        pt={2}
        sx={{
          backgroundImage: ({ functions: { linearGradient, rgba }, palette: { black } }) =>
            `${linearGradient(rgba(black.main, 0.25), rgba(black.main, 0.25))}, url(${bgImage.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Grid
          container
          spacing={2}
          justifyContent='center'
          sx={{ position: 'relative', py: 22, textAlign: 'center' }}
        >
          <Grid
            item
            xs={11}
            lg={6}
          >
            <MDBox mb={1}>
              <MDTypography
                variant='h2'
                color='white'
                fontWeight='bold'
              >
                Pick the plan that&apos;s best for you
              </MDTypography>
            </MDBox>
            <MDBox mb={2}>
              <MDTypography
                variant='body2'
                color='white'
                fontWeight='light'
              >
                You get Free Unlimited Updates and Premium Support on each package.
              </MDTypography>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <Grid
        container
        sx={{ px: 6, my: 8 }}
      >
        <Grid
          item
          xs={12}
        >
          <Card sx={{ mt: -16 }}>
            <MDBox
              minWidth={{ xs: '22rem', md: '25rem' }}
              mx='auto'
              mt={5}
            >
              <AppBar position='static'>
                <Tabs
                  value={tabValue}
                  onChange={tabHandler}
                >
                  <Tab
                    id='monthly'
                    label={
                      <MDBox
                        py={0.5}
                        px={2}
                        color='inherit'
                      >
                        Monthly
                      </MDBox>
                    }
                  />
                  <Tab
                    id='annual'
                    label={
                      <MDBox
                        py={0.5}
                        px={2}
                        color='inherit'
                      >
                        Yearly
                      </MDBox>
                    }
                  />
                </Tabs>
              </AppBar>
            </MDBox>
            {children}
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Header
