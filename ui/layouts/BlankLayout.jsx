// ** MUI Imports
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// ** Hooks
import { useSettings } from '#/lib/hooks/useSettings'

// ** Utilities
import ccm from '#/lib/utils/console-colors'

// Styled component for BlankLayout component
const BlankLayoutWrapper = styled(Box)(({ theme }) => ({

  // For V1 Blank layout pages
  '& .content-center': {
    display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'center',
    padding: theme.spacing(5),
    // minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`,
    // height: '100%',
  },

  // For V2 Blank layout pages
  '& .content-right': {
    display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'center',
    // overflowX: 'hidden',
    // position: 'relative',
    // minHeight: `calc(100vh - ${theme.spacing(theme.mixins.toolbar.minHeight / 4)})`,
    // height: '100%',
  },
}))

// FC
const BlankLayout = ({ children }) => {
  // **
  // console.debug('%c====================================', ccm.black)
  console.debug('🦁 <BlankLayout>')
  // console.debug('%c====================================', ccm.black)

  // ** Hooks
  const { settings, saveSettings } = useSettings()

  return (
    <BlankLayoutWrapper className='layout-wrapper'>
      {children}
    </BlankLayoutWrapper>
  )
}

export default BlankLayout
