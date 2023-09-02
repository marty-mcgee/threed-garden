// ** MUI Imports
import Box from '@mui/material/Box'

// ** Config Import
import themeConfig from '#/lib/config/themeConfig'

// ** Utils
// import { hexToRGBA } from '#/lib/utils/hex-to-rgba'
// ** Menu Components
import HorizontalNavItems from './HorizontalNavItems'

const HorizontalNavigation = (props) => {
  return (
    <Box
      className='menu-content'
      sx={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        '& > *': {
          '&:not(:last-child)': { mr: 2 },
          ...(themeConfig.menuTextTruncate && { maxWidth: 220 }),
        },
      }}>
      <HorizontalNavItems {...props} />
    </Box>
  )
}

export default HorizontalNavigation
