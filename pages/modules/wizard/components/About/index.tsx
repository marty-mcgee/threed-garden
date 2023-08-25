// @mui material components
import Grid from '@mui/material/Grid'
import Icon from '@mui/material/Icon'
import Tooltip from '@mui/material/Tooltip'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDAvatar from '#/lib/mui/MDAvatar'
import MDButton from '#/lib/mui/MDButton'

// Wizard application components
import FormField from '#/page/modules/wizard/components/FormField'

// Images
import team2 from '#/lib/assets/images/people/team-2.jpg'

function About(): JSX.Element {
  return (
    <MDBox>
      <MDBox
        width='82%'
        textAlign='center'
        mx='auto'
        my={4}
      >
        <MDBox mb={1}>
          <MDTypography
            variant='h5'
            fontWeight='regular'
          >
            Let&apos;s start with the basic information
          </MDTypography>
        </MDBox>
        <MDTypography
          variant='body2'
          color='text'
        >
          Let us know your name and email address. Use an address you don&apos;t mind other users contacting you at
        </MDTypography>
      </MDBox>
      <MDBox mt={2}>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            sm={4}
            container
            justifyContent='center'
          >
            <MDBox
              position='relative'
              height='max-content'
              mx='auto'
            >
              <MDAvatar
                src={team2.src}
                alt='profile picture'
                size='xxl'
                variant='rounded'
              />
              <MDBox
                alt='spotify logo'
                position='absolute'
                right={0}
                bottom={0}
                mr={-1}
                mb={-1}
              >
                <Tooltip
                  title='Edit'
                  placement='top'
                >
                  <MDButton
                    variant='gradient'
                    color='info'
                    size='small'
                    iconOnly
                  >
                    <Icon>edit</Icon>
                  </MDButton>
                </Tooltip>
              </MDBox>
            </MDBox>
          </Grid>
          <Grid
            item
            xs={12}
            sm={8}
          >
            <MDBox mb={2}>
              <FormField
                type='text'
                label='First Name'
              />
            </MDBox>
            <MDBox mb={2}>
              <FormField
                type='text'
                label='Last Name'
              />
            </MDBox>
            <MDBox>
              <FormField
                type='email'
                label='Email Address'
              />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  )
}

export default About
