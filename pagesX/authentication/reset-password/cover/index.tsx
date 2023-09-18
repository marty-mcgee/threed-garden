// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDInput from '#/lib/mui/MDInput'
import MDButton from '#/lib/mui/MDButton'

// Authentication layout components
import CoverLayout from '#/pagesX/authentication/components/CoverLayout'

// Images
import bgImage from '#/lib/assets/images/any/bg-reset-cover.jpg'

function Cover(): JSX.Element {
  return (
    <CoverLayout
      coverHeight='50vh'
      image={bgImage}
    >
      <Card>
        <MDBox
          variant='gradient'
          bgColor='info'
          borderRadius='lg'
          coloredShadow='success'
          mx={2}
          mt={-3}
          py={2}
          mb={1}
          textAlign='center'
        >
          <MDTypography
            variant='h3'
            fontWeight='medium'
            color='white'
            mt={1}
          >
            Reset Password
          </MDTypography>
          <MDTypography
            display='block'
            variant='button'
            color='white'
            my={1}
          >
            You will receive an e-mail in maximum 60 seconds
          </MDTypography>
        </MDBox>
        <MDBox
          pt={4}
          pb={3}
          px={3}
        >
          <MDBox
            component='form'
            role='form'
          >
            <MDBox mb={4}>
              <MDInput
                type='email'
                label='Email'
                variant='standard'
                fullWidth
              />
            </MDBox>
            <MDBox
              mt={6}
              mb={1}
            >
              <MDButton
                variant='gradient'
                color='info'
                fullWidth
              >
                reset
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  )
}

export default Cover
