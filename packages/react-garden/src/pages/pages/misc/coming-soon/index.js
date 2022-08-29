// ** MUI Components
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrations from 'src/views/pages/misc/FooterIllustrations'

// ** Styled Components
const BoxWrapper = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    width: '90vw'
  }
}))

const Img = styled('img')(({ theme }) => ({
  [theme.breakpoints.down('lg')]: {
    height: 450,
    marginTop: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    height: 400
  },
  [theme.breakpoints.up('lg')]: {
    marginTop: theme.spacing(16)
  }
}))

const ComingSoon = () => {
  const handleSubmit = e => {
    e.preventDefault()
  }

  return (
    <Box className='content-center'>
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BoxWrapper>
          <Box sx={{ mb: 5.75, textAlign: 'center' }}>
            <Typography variant='h5' sx={{ mb: 1, fontSize: '1.5rem !important' }}>
              We are launching soon 🚀
            </Typography>
            <Typography variant='body2'>
              Our website is opening soon. Please register to get notified when it&prime;s ready!
            </Typography>
          </Box>
          <form noValidate autoComplete='off' onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TextField autoFocus size='small' type='email' placeholder='Enter your email' />
              <Button type='submit' variant='contained' sx={{ ml: 2.5, pl: 5.5, pr: 5.5 }}>
                Notify
              </Button>
            </Box>
          </form>
        </BoxWrapper>
        <Img height='487' alt='coming-soon-illustration' src='/images/pages/misc-coming-soon.png' />
      </Box>
      <FooterIllustrations />
    </Box>
  )
}
ComingSoon.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ComingSoon
