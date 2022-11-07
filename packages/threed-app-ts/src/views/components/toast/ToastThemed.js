// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import PaletteOutline from 'mdi-material-ui/PaletteOutline'

// ** Third Party Components
import toast from 'react-hot-toast'

const ToastThemed = () => {
  // ** Hook
  const theme = useTheme()

  const handleClick = () => {
    return toast.success('Look at me, I have brand styles.', {
      style: {
        padding: '16px',
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`
      },
      iconTheme: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.contrastText
      }
    })
  }

  return (
    <Box sx={{ display: 'flex', textAlign: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <PaletteOutline sx={{ mb: 2, fontSize: '2rem' }} />
      <Typography sx={{ mb: 4, fontWeight: 600 }}>Themed</Typography>
      <Typography sx={{ mb: 3 }}>Customize the default styles the way you want.</Typography>
      <Button sx={{ mb: 8 }} variant='contained' onClick={handleClick}>
        Themed
      </Button>
    </Box>
  )
}

export default ToastThemed
