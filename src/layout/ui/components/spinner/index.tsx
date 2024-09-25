// // ** MUI Imports
// import Box from '@mui/material/Box'
// // import { useTheme } from '@mui/material/styles'
// import CircularProgress from '@mui/material/CircularProgress'

// ** RADIX-UI Imports
import { Spinner } from '@radix-ui/themes'

// ** Next Imports
// import Image from 'next/image'

// const spinnerColor = '#96C02E' // ThreeD Light Green
const spinnerColor = '#4C9900' // ThreeD Green

const FallbackSpinner = () => {
  // ** Hook
  // const theme = useTheme()

  return (
    // <Box
    //   sx={{
    //     // height: '100vh',
    //     // width: '100vw',
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     flexDirection: 'column',
    //   }}
    // >
    //   <CircularProgress disableShrink sx={{ mt: 0, color: spinnerColor }} />
    //   {/* <Box>Building ThreeD Interface...</Box> */}
    // </Box>
    // <Image 
    //   alt='Building ThreeD Interface...'
    //   src={'/images/logos/threed-garden.png'} 
    //   width={48}
    //   height={48}
    // />
    <Spinner />
  )
}

export default FallbackSpinner
