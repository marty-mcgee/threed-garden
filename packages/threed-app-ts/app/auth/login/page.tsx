// ==============================================================
// Login Page (default page for non-authorized users)

'use client'

// ** React Imports
import { useState } from 'react'

// ** Next Imports
import type { NextPage } from 'next'
import Link from 'next/link'
import Image from 'next/image'

// ** MUI Components
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, useTheme } from '@mui/material/styles'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiFormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import Google from 'mdi-material-ui/Google'
import Github from 'mdi-material-ui/Github'
import Twitter from 'mdi-material-ui/Twitter'
import Facebook from 'mdi-material-ui/Facebook'
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

// ** Form Importsinit eth app...
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'
import useBgColor from '#/ui/hooks/useBgColor'
import { useSettings } from '#/ui/hooks/useSettings'

// ** Configs
import themeConfig from '#/lib/config/themeConfig'

// ** Layout Import
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrationsV2 from '#/ui/pages/auth/FooterIllustrationsV2'
import FarmbotDemoSVG from '#/lib/farmbot/FarmbotDemoSVG'

// ** Image Imports
import logo from '#/lib/assets/images/logos/logo-threedgarden.png'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ** Scaffold-ETH Imports
// import React, { FC } from 'react'
import type { TPageProps } from '#/lib/types/models/TAppProps'

// ==============================================================
// IMPORTS COMPLETE
console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {login/page.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

// ==============================================================

// ** Styled Components
const SVGWrapper = styled(Box)(({ theme }: { theme: any }) => {
  return {
    width: '100%',
    padding: theme.spacing(10),
    // paddingRight: '0 !important',
    [theme.breakpoints.down('lg')]: {
      padding: theme.spacing(10),
    },
  }
})

// const LoginIllustrationWrapper = styled(Box)(({ theme }: { theme: any }) => {
//   return {
//     padding: theme.spacing(20),
//     paddingRight: '0 !important',
//     [theme.breakpoints.down('lg')]: {
//       padding: theme.spacing(10),
//     },
//   }
// })

// const LoginIllustration = styled('img')(({ theme }: { theme: any }) => {
//   return {
//     maxWidth: '48rem',
//     [theme.breakpoints.down('lg')]: {
//       maxWidth: '35rem',
//     },
//   }
// })

const RightWrapper = styled(Box)(({ theme }: { theme: any }) => {
  return {
    width: '100%',
    [theme.breakpoints.up('md')]: {
      maxWidth: 400,
    },
  }
})

const BoxWrapper = styled(Box)(({ theme }: { theme: any }) => {
  return {
    [theme.breakpoints.down('xl')]: {
      width: '100%',
    },
    [theme.breakpoints.down('md')]: {
      maxWidth: 400,
    },
  }
})

const TypographyStyled = styled(Typography)(({ theme }: { theme: any }) => {
  return {
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    [theme.breakpoints.down('md')]: { mt: theme.spacing(8) },
  }
})

const LinkStyled = styled('a')(({ theme }: { theme: any }) => {
  return {
    fontSize: '0.875rem',
    textDecoration: 'none',
    color: theme.palette.primary.main,
  }
})

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }: { theme: any }) => {
  return {
    '& .MuiFormControlLabel-label': {
      fontSize: '0.875rem',
      color: theme.palette.text.secondary,
    },
  }
})

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(5).required(),
})

const defaultValues = {
  password: 'admin',
  email: 'mcgee.marty@gmail.com',
}

// ==============================================================

const LoginPage: NextPage<TPageProps> = (): JSX.Element => {
  // **
  console.debug('%c🥕 LoginPage', ccm.green)

  // ** States
  const [showPassword, setShowPassword] = useState(false)

  // ** Hooks
  const auth = useAuth()
  const theme = useTheme()
  const bgClasses = useBgColor()
  const { settings } = useSettings()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  // ** Vars
  const { skin } = settings

  // ** Forms
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema),
  })

  // ** Handlers
  const onSubmit = (data: any) => {
    const { email, password } = data
    auth.login({ email, password }, () => {
      setError('email', {
        type: 'manual',
        message: 'Email or Password is invalid',
      })
    })
  }

  // ** Styles
  const imageSource = skin === 'bordered' ?
    'auth-v2-login-illustration-bordered' : 'auth-v2-login-illustration'

  // ** Return JSX
  return (
    <Box className='content-right'>
      {!hidden ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            alignItems: 'top',
            justifyContent: 'center',
          }}
        >
          <SVGWrapper>
            <Box sx={{ height: 64 }} />
            <FarmbotDemoSVG />
          </SVGWrapper>
          {/*
          <LoginIllustrationWrapper>
            <LoginIllustration
              alt='login-illustration'
              src={`/images/pages/${imageSource}-${theme.palette.mode}.png`}
            />
          </LoginIllustrationWrapper>
          */}
          <FooterIllustrationsV2 />
        </Box>
      ) : null}
      <RightWrapper
        sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}
      >
        <Box
          sx={{
            p: 12,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper',
          }}
        >
          <BoxWrapper>
            <Box
              sx={{
                top: 30,
                left: 40,
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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
                }}
              >
                {themeConfig.templateName}
              </Typography>
            </Box>
            <Box sx={{ mb: 6, mt: 1 }}>
              <TypographyStyled variant='h5'>
                🌱 Welcome to
                <br />
                {themeConfig.templateName}
              </TypographyStyled>
              <Typography variant='body2'>Please sign in to start your adventure...</Typography>
            </Box>
            <Alert
              icon={false}
              sx={{ py: 3, mb: 6, ...bgClasses.primaryLight, '& .MuiAlert-message': { p: 0 } }}
            >
              <Typography
                variant='caption'
                sx={{ mb: 2, display: 'block', color: 'primary.main' }}
              >
                Admin: <strong>mcgee.marty@gmail.com</strong> <br /> Pass: <strong>admin</strong>
              </Typography>
              <Typography
                variant='caption'
                sx={{ display: 'block', color: 'primary.main' }}
              >
                Client: <strong>marty@companyjuice.com</strong> <br /> Pass: <strong>client</strong>
              </Typography>
            </Alert>
            <form
              noValidate
              autoComplete='off'
              onSubmit={handleSubmit(onSubmit)}
            >
              <FormControl
                fullWidth
                sx={{ mb: 4 }}
              >
                <Controller
                  name='email'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      autoFocus
                      label='Email'
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      error={Boolean(errors.email)}
                      placeholder='mcgee.marty@gmail.com'
                    />
                  )}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth>
                <InputLabel
                  htmlFor='auth-login-v2-password'
                  error={Boolean(errors.password)}
                >
                  Password
                </InputLabel>
                <Controller
                  name='password'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <OutlinedInput
                      value={value}
                      onBlur={onBlur}
                      label='Password'
                      onChange={onChange}
                      id='auth-login-v2-password'
                      error={Boolean(errors.password)}
                      type={showPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOutline /> : <EyeOffOutline />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.password && (
                  <FormHelperText
                    sx={{ color: 'error.main' }}
                    id=''
                  >
                    {errors.password.message}
                  </FormHelperText>
                )}
              </FormControl>
              <Box
                sx={{
                  mb: 4,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                <FormControlLabel
                  control={<Checkbox />}
                  label='Remember Me'
                />
                <LinkStyled
                  passHref
                  href='/auth/forgot-password'
                >
                  Forgot Password?
                </LinkStyled>
              </Box>
              <Button
                fullWidth
                size='large'
                type='submit'
                variant='contained'
                sx={{ mb: 7 }}
              >
                Login
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography
                  variant='body2'
                  sx={{ mx: 2 }}
                >
                  New on our platform?
                </Typography>
                <Typography variant='body2'>
                  <LinkStyled
                    href='/auth/register'
                  >
                    Create an Account
                  </LinkStyled>
                </Typography>
              </Box>
              <Divider sx={{ my: 5 }}>or</Divider>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link
                  href='/'
                >
                  <IconButton
                    component='span'
                    onClick={(e) => e.preventDefault()}
                  >
                    <Facebook sx={{ color: '#497ce2' }} />
                  </IconButton>
                </Link>
                <Link
                  href='/'
                >
                  <IconButton
                    component='span'
                    onClick={(e) => e.preventDefault()}
                  >
                    <Google sx={{ color: '#db4437' }} />
                  </IconButton>
                </Link>
                <Link
                  href='/'
                  passHref
                >
                  <IconButton
                    component='span'
                    onClick={(e) => e.preventDefault()}
                  >
                    <Twitter sx={{ color: '#1da1f2' }} />
                  </IconButton>
                </Link>
                <Link
                  href='/'
                >
                  <IconButton
                    component='span'
                    onClick={(e) => e.preventDefault()}
                  >
                    <Github
                      sx={{ color: (theme) => (theme.palette.mode === 'light' ? '#272727' : theme.palette.grey[300]) }}
                    />
                  </IconButton>
                </Link>
              </Box>
            </form>
          </BoxWrapper>
        </Box>
      </RightWrapper>
    </Box>
  )
}
LoginPage.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage
