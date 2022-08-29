// ** MUI Import
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Switch from '@mui/material/Switch'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import TimelineItem from '@mui/lab/TimelineItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import TimelineContent from '@mui/lab/TimelineContent'
import useMediaQuery from '@mui/material/useMediaQuery'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'

// ** Icons Imports
import Web from 'mdi-material-ui/Web'
import Memory from 'mdi-material-ui/Memory'
import Server from 'mdi-material-ui/Server'
import Refresh from 'mdi-material-ui/Refresh'
import Airplane from 'mdi-material-ui/Airplane'
import Cpu64Bit from 'mdi-material-ui/Cpu64Bit'
import MapMarker from 'mdi-material-ui/MapMarker'
import ArrowRight from 'mdi-material-ui/ArrowRight'
import LinkVariant from 'mdi-material-ui/LinkVariant'
import CartOutline from 'mdi-material-ui/CartOutline'
import ClockOutline from 'mdi-material-ui/ClockOutline'
import AccountOutline from 'mdi-material-ui/AccountOutline'
import MessageOutline from 'mdi-material-ui/MessageOutline'
import FileEditOutline from 'mdi-material-ui/FileEditOutline'
import PhoneDialOutline from 'mdi-material-ui/PhoneDialOutline'
import MapMarkerOutline from 'mdi-material-ui/MapMarkerOutline'
import ShareVariantOutline from 'mdi-material-ui/ShareVariantOutline'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomTimelineDot from 'src/@core/components/mui/timeline-dot'

// Styled Timeline component
const Timeline = styled(MuiTimeline)(({ theme }) => ({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root:nth-of-type(even) .MuiTimelineContent-root': {
    textAlign: 'left'
  },
  [theme.breakpoints.down('md')]: {
    '& .MuiTimelineItem-root': {
      width: '100%',
      '&:before': {
        display: 'none'
      }
    }
  }
}))

// Styled component for the image of a shoe
const ImgShoe = styled('img')(({ theme }) => ({
  borderRadius: theme.shape.borderRadius
}))

const TimelineCenter = () => {
  // ** Vars
  const hiddenMD = useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Timeline position={hiddenMD ? 'right' : 'alternate'}>
      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='error'>
            <Airplane fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
              Get on the flight
            </Typography>
            <Typography variant='caption'>Wednesday</Typography>
          </Box>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <span>Charles de Gaulle Airport, Paris</span>{' '}
            <ArrowRight fontSize='small' sx={{ verticalAlign: 'bottom', mx: 4 }} />{' '}
            <span>Heathrow Airport, London</span>
          </Typography>
          <Typography variant='caption'>6:30 AM</Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <img width={28} height={28} alt='invoice.pdf' src='/images/icons/file-icons/pdf.png' />
            <Typography variant='subtitle2' sx={{ ml: 2, fontWeight: 600 }}>
              bookingCard.pdf
            </Typography>
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='primary'>
            <ClockOutline fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
              Interview Schedule
            </Typography>
            <Typography variant='caption'>6th October</Typography>
          </Box>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Possimus quos, voluptates voluptas rem.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex' }}>
              <Avatar src='/images/avatars/2.png' sx={{ width: '2rem', height: '2rem', mr: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Rebecca Godman
                </Typography>
                <Typography variant='caption'>Javascript Developer</Typography>
              </Box>
            </Box>
            <div>
              <IconButton sx={{ color: 'text.secondary' }}>
                <MessageOutline fontSize='small' />
              </IconButton>
              <IconButton sx={{ color: 'text.secondary' }}>
                <PhoneDialOutline fontSize='small' />
              </IconButton>
            </div>
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='warning'>
            <CartOutline fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: { sm: 'row', xs: 'column' } }}>
            <ImgShoe width='85' height='85' alt='Shoe img' src='/images/misc/shoe.jpeg' />
            <Box sx={{ ml: { sm: 3, xs: 0 } }}>
              <Box
                sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography
                  variant='body2'
                  sx={{ mr: 2, fontWeight: 600, mt: { sm: 0, xs: 2 }, color: 'text.primary' }}
                >
                  Sold Puma POPX Blue Color
                </Typography>
                <Typography variant='caption' sx={{ mb: { sm: 0, xs: 2 } }}>
                  4th October
                </Typography>
              </Box>
              <Typography variant='body2' sx={{ mb: 2, color: 'text.primary' }}>
                PUMA presents the latest shoes from its collection. Light & comfortable made with highly durable
                material.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', textAlign: 'center' }}>
            <Box sx={{ mr: 2 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                Customer
              </Typography>
              <Typography variant='caption'>Micheal Scott</Typography>
            </Box>
            <Box sx={{ mr: 2 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                Price
              </Typography>
              <Typography variant='caption'>$375.00</Typography>
            </Box>
            <Box>
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                Quantity
              </Typography>
              <Typography variant='caption'>1</Typography>
            </Box>
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='success'>
            <FileEditOutline fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
              Design Review
            </Typography>
            <Typography variant='caption'>4th October</Typography>
          </Box>
          <Typography variant='body2' sx={{ mb: 2, color: 'text.primary' }}>
            Weekly review of freshly prepared design for our new application.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src='/images/avatars/1.png' sx={{ width: '2rem', height: '2rem', mr: 2 }} />
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              John Doe (Client)
            </Typography>
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='error'>
            <Server fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
              Ubuntu Server
            </Typography>
            <CustomChip size='small' skin='light' color='error' label='Inactive' />
          </Box>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Web />
              </ListItemIcon>
              <ListItemText primary='IP Address' />
              <span>192.654.8.566</span>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cpu64Bit />
              </ListItemIcon>
              <ListItemText primary='CPU' />
              <span>4 Cores</span>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Memory />
              </ListItemIcon>
              <ListItemText primary='Memory' />
              <span>2 GB</span>
            </ListItem>
          </List>
          <Divider />
          <Box sx={{ ml: 4, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <IconButton sx={{ color: 'text.primary' }}>
                <ShareVariantOutline fontSize='small' />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <Refresh fontSize='small' />
              </IconButton>
            </div>
            <Switch sx={{ mr: 2 }} />
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <CustomTimelineDot skin='light' color='success'>
            <MapMarkerOutline fontSize='small' />
          </CustomTimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
              <MapMarker sx={{ verticalAlign: 'bottom', mr: 2 }} fontSize='small' />
              <span>Location</span>
            </Typography>
            <CustomChip size='small' label='High' skin='light' color='error' />
          </Box>
          <Typography variant='body2' sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
            Final location for the company celebration.
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, quidem?
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <IconButton sx={{ color: 'text.primary' }}>
                <LinkVariant fontSize='small' />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <MessageOutline fontSize='small' />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <AccountOutline fontSize='small' />
              </IconButton>
            </Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              Due Date: 15th Jan
            </Typography>
          </Box>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  )
}

export default TimelineCenter
