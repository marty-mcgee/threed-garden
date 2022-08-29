// ** MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import HelpCircleOutline from 'mdi-material-ui/HelpCircleOutline'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const CardSupport = () => {
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          p: theme => `${theme.spacing(9.75, 5, 9.25)} !important`
        }}
      >
        <CustomAvatar skin='light' sx={{ width: 50, height: 50, mb: 2.25 }}>
          <HelpCircleOutline sx={{ fontSize: '2rem' }} />
        </CustomAvatar>
        <Typography variant='h6' sx={{ mb: 2.75 }}>
          Support
        </Typography>
        <Typography variant='body2' sx={{ mb: 6 }}>
          According to us blisters are a very common thing and we come across them very often in our daily lives. It is
          a very common occurrence like cold or fever depending upon your lifestyle.
        </Typography>
        <Button variant='contained' sx={{ p: theme => theme.spacing(1.75, 5.5) }}>
          Contact Now
        </Button>
      </CardContent>
    </Card>
  )
}

export default CardSupport
