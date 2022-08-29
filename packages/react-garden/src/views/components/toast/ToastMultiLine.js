// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import TextBoxOutline from 'mdi-material-ui/TextBoxOutline'

// ** Third Party Components
import toast from 'react-hot-toast'

const ToastMultiLine = () => {
  const handleClick = () => {
    return toast(
      "This toast is super big. I don't think anyone could eat it in one bite. It's larger than you expected. You eat it but it does not seem to get smaller."
    )
  }

  return (
    <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <TextBoxOutline sx={{ mb: 2, fontSize: '2rem' }} />
      <Typography sx={{ mb: 4, fontWeight: 600 }}>Multi Line</Typography>
      <Typography sx={{ mb: 3 }}>The most basic variant with longer texts</Typography>
      <Button sx={{ mb: 8 }} variant='contained' onClick={handleClick}>
        Multi Line
      </Button>
    </Box>
  )
}

export default ToastMultiLine
