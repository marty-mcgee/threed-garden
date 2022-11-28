import { useState } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDAvatar from '#/lib/mui/MDAvatar'

// Images
import profilePic from '#/lib/assets/images/people/team-0.png'

function Header(): JSX.Element {
  const [visible, setVisible] = useState<boolean>(true)

  const handleSetVisible = () => setVisible(!visible)

  return (
    <Card id='profile'>
      <MDBox p={1}>
        <Grid
          container
          spacing={2}
          alignItems='center'
        >
          <Grid item>
            <MDAvatar
              src={profilePic.src}
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
                Marty McGee
              </MDTypography>
              <MDTypography
                variant='button'
                color='text'
                fontWeight='medium'
              >
                Senior Web Visualization Developer
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            sx={{ ml: 'auto' }}
          >
            <MDBox
              display='flex'
              justifyContent={{ md: 'flex-end' }}
              alignItems='center'
              lineHeight={1}
            >
              <MDTypography
                variant='caption'
                fontWeight='regular'
              >
                Switch to {visible ? 'invisible mode' : 'visible mode'}
              </MDTypography>
              <MDBox ml={1}>
                <Switch
                  checked={visible}
                  onChange={handleSetVisible}
                />
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

export default Header
