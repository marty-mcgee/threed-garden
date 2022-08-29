// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'

// ** Third Party Components
import toast from 'react-hot-toast'

const ToastError = () => {
  return (
    <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <Close sx={{ mb: 2, fontSize: '2rem' }} />
      <Typography sx={{ mb: 4, fontWeight: 600 }}>Error</Typography>
      <Typography sx={{ mb: 3 }}>Creates a notification with an animated error icon.</Typography>
      <Button sx={{ mb: 8 }} color='error' variant='contained' onClick={() => toast.error("This didn't work.")}>
        Error
      </Button>
    </Box>
  )
}

export default ToastError
