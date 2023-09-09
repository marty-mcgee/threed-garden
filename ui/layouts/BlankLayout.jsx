// ** MUI Imports
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// Styled component for Blank Layout component
const BlankLayoutWrapper = styled(Box)(({ theme }) => ({
  height: '100vh',

  // For V1 Blank layout pages
  '& .content-center': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
    minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`,
  },

  // For V2 Blank layout pages
  '& .content-right': {
    display: 'flex',
    overflowX: 'hidden',
    position: 'relative',
    minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`,
  },
}))

const BlankLayout = ({ children }) => {
  return (
    <BlankLayoutWrapper className='layout-wrapper'>
      <Box
        id='app-content'
        sx={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}
        // sx={{
        //   overflowX: 'hidden',
        //   position: 'relative',
        //   minHeight: (theme) => `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`,
        // }}
      >
        {children}
      </Box>
      <>BlankLayout</>
    </BlankLayoutWrapper>
  )
}

export default BlankLayout
