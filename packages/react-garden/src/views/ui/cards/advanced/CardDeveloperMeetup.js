// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import StarOutline from 'mdi-material-ui/StarOutline'
import AccountOutline from 'mdi-material-ui/AccountOutline'
import DotsHorizontal from 'mdi-material-ui/DotsHorizontal'
import MapMarkerOutline from 'mdi-material-ui/MapMarkerOutline'
import CheckCircleOutline from 'mdi-material-ui/CheckCircleOutline'
import ClockTimeThreeOutline from 'mdi-material-ui/ClockTimeThreeOutline'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const CardDeveloperMeetup = () => {
  return (
    <Card>
      <CardMedia sx={{ height: 168 }} image='/images/cards/workstation.png' />
      <CardContent sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3, width: 50, height: 56 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ color: 'primary.main' }}>
                Jan
              </Typography>
              <Typography variant='h6' sx={{ color: 'primary.main' }}>
                24
              </Typography>
            </Box>
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ mb: 0.5, fontWeight: 600 }}>Developer Meetup</Typography>
            <Typography variant='caption'>
              The WordPress open source, free software project is the community behind the…
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StarOutline sx={{ mb: 0.5 }} />
            <Typography variant='caption'>Interested</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircleOutline sx={{ mb: 0.5 }} />
            <Typography variant='caption'>Joined</Typography>
          </Box>
          <Box sx={{ color: 'primary.main', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AccountOutline sx={{ mb: 0.5 }} />
            <Typography variant='caption' sx={{ color: 'primary.main' }}>
              Invited
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <DotsHorizontal sx={{ mb: 0.5 }} />
            <Typography variant='caption'>More</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 2, display: 'flex' }}>
          <ClockTimeThreeOutline sx={{ mr: 2.5, mt: 1, fontSize: '1.25rem', color: 'text.secondary' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='caption'>Tuesday, 24 january, 10:20 - 12:30</Typography>
            <Typography variant='caption'>After 1 Week</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex' }}>
          <MapMarkerOutline sx={{ mr: 2.5, mt: 1, fontSize: '1.25rem', color: 'text.secondary' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='caption'>The Rochard NYC</Typography>
            <Typography variant='caption'>1305 Lexington Ave, New York</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CardDeveloperMeetup
