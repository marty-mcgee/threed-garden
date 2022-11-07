// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center'
  }
}))

// Styled component for the image
const Img = styled('img')(({ theme }) => ({
  right: 13,
  bottom: 0,
  height: 185,
  position: 'absolute',
  [theme.breakpoints.down('sm')]: {
    height: 165,
    position: 'static'
  }
}))

const EcommerceCongratulations = () => {
  return (
    <Card sx={{ position: 'relative', overflow: 'visible', mt: { xs: 0, sm: 7.5, md: 0 } }}>
      <CardContent sx={{ p: theme => `${theme.spacing(8.25, 7.5, 6.25, 7.5)} !important` }}>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <Typography variant='h5' sx={{ mb: 6.5 }}>
              Congratulations{' '}
              <Box component='span' sx={{ fontWeight: 'bold' }}>
                John
              </Box>
              ! 🎉
            </Typography>
            <Typography variant='body2'>You have done 72% 🤩 more sales today.</Typography>
            <Typography variant='body2'>Check your new raising badge in your profile.</Typography>
          </Grid>
          <StyledGrid item xs={12} sm={6}>
            <Img alt='Congratulations John' src='/images/cards/illustration-john-2.png' />
          </StyledGrid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default EcommerceCongratulations
