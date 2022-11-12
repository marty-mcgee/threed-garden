import { useState } from 'react'

// nextjs components
import Link from 'next/link'

// @mui material components
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDInput from '~/components/mui/MDInput'
import MDButton from '~/components/mui/MDButton'

// Authentication layout components
import CoverLayout from '~/pages/authentication/components/CoverLayout'

// Images
import bgImage from '~/assets/images/any/bg-sign-in-cover.jpg'

function Cover(): JSX.Element {
  const [rememberMe, setRememberMe] = useState<boolean>(true)

  const handleSetRememberMe = () => setRememberMe(!rememberMe)

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox
          variant='gradient'
          bgColor='info'
          borderRadius='lg'
          coloredShadow='success'
          mx={2}
          mt={-3}
          p={3}
          mb={1}
          textAlign='center'
        >
          <MDTypography
            variant='h4'
            fontWeight='medium'
            color='white'
            mt={1}
          >
            Sign in
          </MDTypography>
          <MDTypography
            display='block'
            variant='button'
            color='white'
            my={1}
          >
            Enter your email and password to Sign In
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
            <MDBox mb={2}>
              <MDInput
                type='email'
                label='Email'
                variant='standard'
                fullWidth
                placeholder='john@example.com'
                InputLabelProps={{ shrink: true }}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type='password'
                label='Password'
                variant='standard'
                fullWidth
                placeholder='************'
                InputLabelProps={{ shrink: true }}
              />
            </MDBox>
            <MDBox
              display='flex'
              alignItems='center'
              ml={-1}
            >
              <Switch
                checked={rememberMe}
                onChange={handleSetRememberMe}
              />
              <MDTypography
                variant='button'
                fontWeight='regular'
                color='text'
                onClick={handleSetRememberMe}
                sx={{ cursor: 'pointer', userSelect: 'none', ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox
              mt={4}
              mb={1}
            >
              <MDButton
                variant='gradient'
                color='info'
                fullWidth
              >
                sign in
              </MDButton>
            </MDBox>
            <MDBox
              mt={3}
              mb={1}
              textAlign='center'
            >
              <MDTypography
                variant='button'
                color='text'
              >
                Don&apos;t have an account?{' '}
                <MDTypography
                  component={Link}
                  href='/authentication/sign-up/cover'
                  variant='button'
                  color='info'
                  fontWeight='medium'
                  textGradient
                >
                  Sign up
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  )
}

export default Cover
