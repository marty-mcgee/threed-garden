// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import Heart from 'mdi-material-ui/Heart'
import Twitter from 'mdi-material-ui/Twitter'
import ShareVariant from 'mdi-material-ui/ShareVariant'

const CardTwitter = () => {
  return (
    <Card sx={{ border: 0, boxShadow: 0, color: 'common.white', backgroundColor: 'info.main' }}>
      <CardContent sx={{ p: theme => `${theme.spacing(3.25, 5, 4.5)} !important` }}>
        <Typography variant='h6' sx={{ display: 'flex', mb: 2.75, alignItems: 'center', color: 'common.white' }}>
          <Twitter sx={{ mr: 2.5 }} />
          Twitter Card
        </Typography>
        <Typography variant='body2' sx={{ mb: 3, color: 'common.white' }}>
          Turns out semicolon-less style is easier and safer in TS because most gotcha edge cases are type invalid as
          well.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar alt='Mary Vaughn' src='/images/avatars/4.png' sx={{ width: 34, height: 34, mr: 2.75 }} />
            <Typography variant='body2' sx={{ color: 'common.white' }}>
              Mary Vaughn
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3.5 }}>
              <Heart sx={{ mr: 1.25 }} />
              <Typography variant='body2' sx={{ color: 'common.white' }}>
                1.2k
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShareVariant sx={{ mr: 1.25 }} />
              <Typography variant='body2' sx={{ color: 'common.white' }}>
                80
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CardTwitter
