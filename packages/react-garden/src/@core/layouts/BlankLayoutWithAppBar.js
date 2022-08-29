// ** MUI Imports
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// ** AppBar Imports
import AppBar from 'src/@core/layouts/components/blank-layout-with-appBar'

// Styled component for Blank Layout with AppBar component
const BlankLayoutWithAppBarWrapper = styled(Box)(({ theme }) => ({
  height: '100vh',

  // For V1 Blank layout pages
  '& .content-center': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
    minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`
  },

  // For V2 Blank layout pages
  '& .content-right': {
    display: 'flex',
    overflowX: 'hidden',
    position: 'relative',
    minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`
  }
}))

const BlankLayoutWithAppBar = props => {
  // ** Props
  const { children } = props

  return (
    <BlankLayoutWithAppBarWrapper>
      <AppBar />
      <Box
        className='app-content'
        sx={{
          overflowX: 'hidden',
          position: 'relative',
          minHeight: theme => `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`
        }}
      >
        {children}
      </Box>
    </BlankLayoutWithAppBarWrapper>
  )
}

export default BlankLayoutWithAppBar
