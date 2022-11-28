import { useState, useEffect, ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import AppBar from '@mui/material/AppBar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDAvatar from '~/components/mui/MDAvatar'

// ThreeD Garden Base Styles
import breakpoints from '~/themes/theme-light/base/breakpoints'

// Images
import profileImage from '~/assets/images/people/team-0.png'
import backgroundImage from '~/assets/images/any/bg-profile-garden.jpg'

function Header({ children }: { children?: ReactNode }): JSX.Element {
  const [tabsOrientation, setTabsOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation('vertical')
        : setTabsOrientation('horizontal')
    }

    /**
     The event listener that's calling the handleTabsOrientation function when resizing the window.
    */
    window.addEventListener('resize', handleTabsOrientation)

    // Call the handleTabsOrientation function to set the state with the initial value.
    handleTabsOrientation()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleTabsOrientation)
  }, [tabsOrientation])

  const handleSetTabValue = (event: any, newValue: any) => setTabValue(newValue)

  return (
    <MDBox
      mb={3}
      mx={1}
    >
      <MDBox
        display='flex'
        alignItems='center'
        position='relative'
        minHeight='18.75rem'
        borderRadius='xl'
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(rgba(gradients.info.main, 0.05), rgba(gradients.info.state, 0.1))}, url(${
              backgroundImage.src
            })`,
          backgroundSize: 'cover',
          backgroundPosition: '50%',
          overflow: 'hidden',
        }}
      />
      <Card
        sx={{
          position: 'relative',
          mt: -8,
          mx: 2,
          py: 2,
          px: 2,
        }}
      >
        <Grid
          container
          spacing={2}
          alignItems='center'
        >
          <Grid item>
            <MDAvatar
              src={profileImage.src}
              alt='profile-image'
              size='xl'
              shadow='sm'
            />
          </Grid>
          <Grid item>
            <MDBox
              height='100%'
              mt={0.5}
              lineHeight={1}
            >
              <MDTypography
                variant='h5'
                fontWeight='medium'
              >
                Garden Master
              </MDTypography>
              <MDTypography
                variant='button'
                color='text'
                fontWeight='regular'
              >
                Author, Contributor
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            lg={5}
            sx={{ ml: 'auto' }}
          >
            <AppBar position='static'>
              <Tabs
                orientation={tabsOrientation}
                value={tabValue}
                onChange={handleSetTabValue}
              >
                <Tab
                  label='App'
                  sx={{ p: 1 }}
                  icon={
                    <Icon
                      fontSize='small'
                      sx={{ mt: -0.25 }}
                    >
                      home
                    </Icon>
                  }
                />
                <Tab
                  label='Messages'
                  sx={{ p: 1 }}
                  icon={
                    <Icon
                      fontSize='small'
                      sx={{ mt: -0.25 }}
                    >
                      email
                    </Icon>
                  }
                />
                <Tab
                  label='Settings'
                  sx={{ p: 1 }}
                  icon={
                    <Icon
                      fontSize='small'
                      sx={{ mt: -0.25 }}
                    >
                      settings
                    </Icon>
                  }
                />
              </Tabs>
            </AppBar>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  )
}

// Declaring default props for Header
Header.defaultProps = {
  children: '',
}

export default Header
