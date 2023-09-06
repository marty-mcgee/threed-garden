// ** MUI Import
import Box from '@mui/material/Box'
// import { useTheme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// ** Next Imports
// import Image from 'next/image'

// ** Image Imports
// import logo from '#/lib/assets/images/logos/logo-threedgarden.png'

const FallbackSpinner = () => {
  // ** Hook
  // const theme = useTheme()

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
      <CircularProgress disableShrink sx={{ mt: 0, color: '#96C02E' }} />
      <Box>Thinking...</Box>
    </Box>
  )
}

export default FallbackSpinner
