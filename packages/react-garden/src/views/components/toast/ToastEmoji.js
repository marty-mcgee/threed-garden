// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import StickerEmoji from 'mdi-material-ui/StickerEmoji'

// ** Third Party Components
import toast from 'react-hot-toast'

const ToastEmoji = () => {
  return (
    <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <StickerEmoji sx={{ mb: 2, fontSize: '2rem' }} />
      <Typography sx={{ mb: 4, fontWeight: 600 }}>Emoji</Typography>
      <Typography sx={{ mb: 3 }}>Add any emoji instead of an icon</Typography>
      <Button sx={{ mb: 8 }} variant='contained' onClick={() => toast('Good Job!', { icon: '👏' })}>
        Emoji
      </Button>
    </Box>
  )
}

export default ToastEmoji
