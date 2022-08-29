// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'
import CalendarBlankOutline from 'mdi-material-ui/CalendarBlankOutline'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'

const data = [
  {
    chipText: 'Business',
    chipColor: 'primary',
    title: 'Call with Woods',
    src: '/images/avatars/4.png',
    subtitle: '21 Jul | 08:20-10:30'
  },
  {
    chipColor: 'success',
    chipText: 'Meditation',
    title: 'Call with hilda',
    src: '/images/avatars/8.png',
    subtitle: '24 Jul | 11:30-12:00'
  },
  {
    chipText: 'Dinner',
    chipColor: 'error',
    title: 'Conference call',
    src: '/images/avatars/7.png',
    subtitle: '28 Jul | 05:00-6:45'
  },
  {
    chipText: 'Meetup',
    chipColor: 'secondary',
    title: 'Meeting with Mark',
    src: '/images/avatars/3.png',
    subtitle: '03 Aug | 07:00-8:30'
  },
  {
    chipText: 'Business',
    chipColor: 'primary',
    title: 'Meeting in Oakland',
    src: '/images/avatars/2.png',
    subtitle: '14 Aug | 04:15-05:30'
  },
  {
    chipText: 'Party',
    chipColor: 'warning',
    title: 'Meeting with Carl',
    src: '/images/avatars/1.png',
    subtitle: '05 Oct | 10:00-12:45'
  }
]

const CrmMeetingSchedule = () => {
  return (
    <Card>
      <CardHeader
        title='Meeting Schedule'
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />
      <CardContent>
        {data.map((item, index) => {
          return (
            <Box
              key={item.title}
              sx={{
                display: 'flex',
                alignItems: 'center',
                ...(index !== data.length - 1 ? { mb: 6 } : {})
              }}
            >
              <Avatar src={item.src} sx={{ mr: 3, width: 38, height: 38 }} />
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', mb: 0.4, flexDirection: 'column' }}>
                  <Typography
                    sx={{ fontWeight: 500, lineHeight: 1.71, letterSpacing: '0.22px', fontSize: '0.875rem !important' }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarBlankOutline
                      sx={{ mr: 1, fontSize: '0.875rem', color: 'text.secondary', verticalAlign: 'middle' }}
                    />
                    <Typography variant='caption'>{item.subtitle}</Typography>
                  </Box>
                </Box>
                <CustomChip
                  skin='light'
                  size='small'
                  label={item.chipText}
                  color={item.chipColor}
                  sx={{ height: 20, mt: 0.4, fontSize: '0.75rem', fontWeight: 600 }}
                />
              </Box>
            </Box>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default CrmMeetingSchedule
