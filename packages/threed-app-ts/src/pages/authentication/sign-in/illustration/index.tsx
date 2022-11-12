import { useState } from 'react'

// nextjs components
import Link from 'next/link'

// @mui material components
import Switch from '@mui/material/Switch'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDInput from '~/components/mui/MDInput'
import MDButton from '~/components/mui/MDButton'

// Authentication layout components
import IllustrationLayout from '~/pages/authentication/components/IllustrationLayout'

// Image
import bgImage from '~/assets/images/illustrations/illustration-reset.jpg'

function Illustration(): JSX.Element {
  const [rememberMe, setRememberMe] = useState<boolean>(false)

  const handleSetRememberMe = () => setRememberMe(!rememberMe)

  return (
    <IllustrationLayout
      title='Sign In'
      description='Enter your email and password to sign in'
      illustration={bgImage.src}
    >
      <MDBox
        component='form'
        role='form'
      >
        <MDBox mb={2}>
          <MDInput
            type='email'
            label='Email'
            fullWidth
          />
        </MDBox>
        <MDBox mb={2}>
          <MDInput
            type='password'
            label='Password'
            fullWidth
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
            size='large'
            fullWidth
          >
            sign in
          </MDButton>
        </MDBox>
        <MDBox
          mt={3}
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
    </IllustrationLayout>
  )
}

export default Illustration
