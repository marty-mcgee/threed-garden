// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// ** Footer Content Component
import FooterContent from './FooterContent'

const Footer = props => {
  // ** Props
  const { settings, footerContent: userFooterContent } = props

  // ** Hook
  const theme = useTheme()

  // ** Vars
  const { skin, footer, contentWidth } = settings
  if (footer === 'hidden') {
    return null
  }

  return (
    <Box
      component='footer'
      className='layout-footer'
      sx={{
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(footer === 'fixed' && { bottom: 0, px: [4, 6], position: 'sticky' })
      }}
    >
      <Box
        className='footer-content-container'
        sx={{
          py: 4,
          px: [4, 6],
          width: '100%',
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          ...(contentWidth === 'boxed' && { '@media (min-width:1440px)': { maxWidth: 1440 } }),
          ...(footer === 'fixed' && {
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[skin === 'bordered' ? 0 : 4],
            ...(contentWidth === 'boxed' && {
              '@media (min-width:1440px)': { maxWidth: `calc(1440px - ${theme.spacing(6)} * 2)` }
            }),
            ...(skin === 'bordered'
              ? { border: `1px solid ${theme.palette.divider}`, borderBottomWidth: 0 }
              : {
                  boxShadow: `0 -4px 8px -2px rgba(${
                    theme.palette.mode === 'light' ? theme.palette.customColors.main : '19, 17, 32'
                  }, ${theme.palette.mode === 'light' ? 0.2 : 0.42})`
                })
          })
        }}
      >
        {userFooterContent ? userFooterContent(props) : <FooterContent />}
      </Box>
    </Box>
  )
}

export default Footer
