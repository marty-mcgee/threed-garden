// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import PencilOutline from 'mdi-material-ui/PencilOutline'

// ** Third Party Components
import toast from 'react-hot-toast'

const ToastCustom = () => {
  const handleClick = () => {
    return toast(
      t => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar alt='Victor Anderson' src='/images/avatars/3.png' sx={{ mr: 3, width: 40, height: 40 }} />
            <Box>
              <Typography>John Doe</Typography>
              <Typography variant='caption'>Sure! 8:30pm works great!</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => toast.dismiss(t.id)}>
            <Close fontSize='small' />
          </IconButton>
        </Box>
      ),
      {
        style: {
          minWidth: '300px'
        }
      }
    )
  }

  return (
    <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <PencilOutline sx={{ mb: 2, fontSize: '2rem' }} />
      <Typography sx={{ mb: 4, fontWeight: 600 }}>Custom</Typography>
      <Typography sx={{ mb: 3 }}>Make a toast using any custom content</Typography>
      <Button sx={{ mb: 8 }} variant='contained' onClick={handleClick}>
        Custom
      </Button>
    </Box>
  )
}

export default ToastCustom
