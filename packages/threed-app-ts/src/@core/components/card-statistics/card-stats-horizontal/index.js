// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiAvatar from '@mui/material/Avatar'

// ** Icons Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'
import ChevronDown from 'mdi-material-ui/ChevronDown'

// ** Styled Avatar component
const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 44,
  height: 44,
  boxShadow: theme.shadows[3],
  marginRight: theme.spacing(2.75),
  backgroundColor: theme.palette.background.paper,
  '& svg': {
    fontSize: '1.75rem'
  }
}))

const CardStatsHorizontal = props => {
  // ** Props
  const { title, color, icon, stats, trend, trendNumber } = props
  const TrendIcon = trend === 'positive' ? ChevronUp : ChevronDown

  return (
    <Card
      sx={{
        backgroundColor: 'transparent !important',
        boxShadow: theme => `${theme.shadows[0]} !important`,
        border: theme => `1px solid ${theme.palette.divider}`
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar variant='rounded' sx={{ color: `${color}.main` }}>
            {icon}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='caption'>{title}</Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant='h6' sx={{ mr: 1, fontWeight: 600, lineHeight: 1.05 }}>
                {stats}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendIcon sx={{ color: trend === 'positive' ? 'success.main' : 'error.main' }} />
                <Typography
                  variant='caption'
                  sx={{ fontWeight: 600, color: trend === 'positive' ? 'success.main' : 'error.main' }}
                >
                  {trendNumber}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CardStatsHorizontal

CardStatsHorizontal.defaultProps = {
  color: 'primary',
  trend: 'positive'
}
