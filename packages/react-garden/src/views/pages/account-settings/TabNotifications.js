// ** MUI Imports
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiFormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ChartTimelineVariant from 'mdi-material-ui/ChartTimelineVariant'

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
    marginLeft: theme.spacing(1.5),
    color: theme.palette.text.secondary
  }
}))

const TabNotifications = () => {
  return (
    <CardContent>
      <form>
        <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center' }}>
          <ChartTimelineVariant sx={{ mr: 2.5 }} />
          <Typography variant='h6'>Activity</Typography>
        </Box>

        <div>
          <FormControlLabel control={<Switch defaultChecked />} label='Email me when someone comments on my article' />
        </div>
        <div>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Email me when someone answers on my forum thread'
          />
        </div>
        <div>
          <FormControlLabel control={<Switch />} label='Email me when someone follows me' />
        </div>

        <Box sx={{ mt: 7, mb: 3.5, display: 'flex', alignItems: 'center' }}>
          <EmailOutline sx={{ mr: 2.5 }} />
          <Typography variant='h6'>Application</Typography>
        </Box>

        <div>
          <FormControlLabel control={<Switch />} label='News and announcements' />
        </div>
        <div>
          <FormControlLabel control={<Switch defaultChecked />} label='Weekly product updates' />
        </div>
        <div>
          <FormControlLabel control={<Switch />} label='Weekly blog digest' />
        </div>

        <Box sx={{ mt: 7.5 }}>
          <Button variant='contained' sx={{ mr: 3.5 }}>
            Save Changes
          </Button>
          <Button type='reset' variant='outlined' color='secondary'>
            Reset
          </Button>
        </Box>
      </form>
    </CardContent>
  )
}

export default TabNotifications
