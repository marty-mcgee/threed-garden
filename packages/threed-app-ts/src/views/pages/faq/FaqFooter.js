// ** MUI Imports
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Icons Imports
import Phone from 'mdi-material-ui/Phone'
import EmailOutline from 'mdi-material-ui/EmailOutline'

// Styled Box component
const StyledBox1 = styled(Box)(({ theme }) => ({
  display: 'flex',
  borderRadius: '5px',
  alignItems: 'center',
  flexDirection: 'column',
  padding: theme.spacing(6.5, 6),
  marginRight: theme.spacing(3.125),
  backgroundColor: `rgba(${theme.palette.customColors.main}, 0.04)`,
  [theme.breakpoints.down('md')]: {
    marginRight: 0,
    marginBottom: theme.spacing(3.125)
  }
}))

// Styled Box component
const StyledBox2 = styled(Box)(({ theme }) => ({
  display: 'flex',
  borderRadius: '5px',
  alignItems: 'center',
  flexDirection: 'column',
  padding: theme.spacing(6.5, 6),
  marginLeft: theme.spacing(3.125),
  backgroundColor: `rgba(${theme.palette.customColors.main}, 0.04)`,
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    marginTop: theme.spacing(3.125)
  }
}))

const FaqFooter = () => {
  return (
    <Box sx={{ mt: 13 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='h6'>You still have a question?</Typography>
        <Typography variant='body2' sx={{ mb: 11 }}>
          If you cannot find a question in our FAQ, you can always contact us. We will answer to you shortly!
        </Typography>
      </Box>

      <Grid container>
        <Grid item xs={12} md={6}>
          <StyledBox1>
            <Avatar
              variant='rounded'
              sx={{ backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.08)` }}
            >
              <Phone sx={{ fontSize: '1.375rem' }} />
            </Avatar>
            <Typography variant='h6' sx={{ mt: 5 }}>
              + (810) 2548 2568
            </Typography>
            <Typography variant='body2' sx={{ mt: 1.5 }}>
              We are always happy to help!
            </Typography>
          </StyledBox1>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledBox2>
            <Avatar
              variant='rounded'
              sx={{ backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.08)` }}
            >
              <EmailOutline sx={{ fontSize: '1.375rem' }} />
            </Avatar>
            <Typography variant='h6' sx={{ mt: 5 }}>
              hello@help.com
            </Typography>
            <Typography variant='body2' sx={{ mt: 1.5 }}>
              Best way to get answer faster!
            </Typography>
          </StyledBox2>
        </Grid>
      </Grid>
    </Box>
  )
}

export default FaqFooter
