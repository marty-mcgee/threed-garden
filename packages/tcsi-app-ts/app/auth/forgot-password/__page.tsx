// ==============================================================
// User Request New Password Page (for existing users)

'use client'

// ** Next Imports
import type { NextPage } from 'next'
import Link from 'next/link'
import Image from 'next/image'

// ** MUI Components
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import ChevronLeft from 'mdi-material-ui/ChevronLeft'

// ** Configs
import themeConfig from '#/lib/config/themeConfig'

// ** Layout Import
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Hooks
import { useSettings } from '#/ui/hooks/useSettings'

// ** Demo Imports
import FooterIllustrationsV2 from '#/ui/pages/auth/FooterIllustrationsV2'
import FarmbotDemoSVG from '#/lib/farmbot/FarmbotDemoSVG'

// ** Image Imports
import logo from '#/lib/assets/images/logos/logo-threedgarden.png'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
import type { TPageProps } from '#/lib/types/TAppProps'

// ==============================================================
// IMPORTS COMPLETE
console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {register/page.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

// ==============================================================

// Styled Components
const ForgotPasswordIllustrationWrapper = styled(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(20),
  paddingRight: '0 !important',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(10),
  },
}))

const ForgotPasswordIllustration = styled('img')(({ theme }: { theme: any }) => ({
  maxWidth: '53.125rem',
  [theme.breakpoints.down('lg')]: {
    maxWidth: '35rem',
  },
}))

const RightWrapper = styled(Box)(({ theme }: { theme: any }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 400,
  },
}))

const BoxWrapper = styled(Box)(({ theme }: { theme: any }) => ({
  [theme.breakpoints.down('xl')]: {
    width: '100%',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 400,
  },
}))

const TypographyStyled = styled(Typography)(({ theme }: { theme: any }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: { mt: theme.spacing(8) },
}))

const LinkStyled = styled('a')(({ theme }: { theme: any }) => ({
  display: 'flex',
  fontSize: '0.875rem',
  alignItems: 'center',
  textDecoration: 'none',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}))

// ==============================================================

const ForgotPasswordPage: NextPage<TPageProps> = (): JSX.Element => {
  // **
  console.debug('%c🥕 ForgotPasswordPage', ccm.green)

  // ** Hooks
  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { skin } = settings
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  // ** Handlers
  const handleSubmit = (e: any) => {
    e.preventDefault()
  }

  // ** Styles
  const imageSource =
    skin === 'bordered' ? 'auth-v2-forgot-password-illustration-bordered' : 'auth-v2-forgot-password-illustration'

  // ** Return JSX
  return (
    <Box className='content-right'>
      {!hidden ? (
        <Box sx={{ flex: 1, display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <ForgotPasswordIllustrationWrapper>
            <ForgotPasswordIllustration
              alt='forgot-password-illustration'
              src={`/images/pages/${imageSource}-${theme.palette.mode}.png`}
            />
          </ForgotPasswordIllustrationWrapper>
          <FooterIllustrationsV2 />
        </Box>
      ) : null}
      <RightWrapper sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}>
        <Box
          sx={{
            p: 12,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper',
          }}>
          <BoxWrapper>
            <Box
              sx={{
                top: 30,
                left: 40,
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {/* App Logo */}
              <Link href='/'>
                <Image
                  src={logo}
                  width={48}
                  height={48}
                  alt={themeConfig.templateName}
                />
              </Link>
              {/* App Name */}
              <Typography
                variant='h6'
                sx={{
                  ml: 3,
                  lineHeight: 1,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '1.5rem !important',
                }}>
                {themeConfig.templateName}
              </Typography>
            </Box>
            <Box sx={{ mb: 6 }}>
              <TypographyStyled variant='h5'>Forgot Password? 🔒</TypographyStyled>
              <Typography variant='body2'>
                Enter your email and we&prime;ll send you instructions to reset your password
              </Typography>
            </Box>
            <form noValidate autoComplete='off' onSubmit={handleSubmit}>
              <TextField autoFocus type='email' label='Email' sx={{ display: 'flex', mb: 4 }} />
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5.25 }}>
                Send reset link
              </Button>
              <Typography variant='body2' sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkStyled href='/auth/login'>
                  <ChevronLeft />
                  <span>Login now</span>
                </LinkStyled>
              </Typography>
            </form>
          </BoxWrapper>
        </Box>
      </RightWrapper>
    </Box>
  )
}
ForgotPasswordPage.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
ForgotPasswordPage.guestGuard = true

export default ForgotPasswordPage
