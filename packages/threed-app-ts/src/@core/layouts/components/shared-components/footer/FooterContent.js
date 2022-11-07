// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const FooterContent = () => {
  // ** Var
  const hidden = true // useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      {!hidden ? null : (
        <Typography sx={{ mr: 2 }}>
          {/* {`© ${new Date().getFullYear()} `} */}
          {/* <Box component='span' sx={{ color: 'error.main' }}>
            💚
          </Box> */}
          {``}
          <Link target='_blank' href='https://threed.ai/'>
            🌱 threed.ai
          </Link>
        </Typography>
      )}
      {hidden ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': { mr: 4 } }}>
          <Link target='_blank' href='https://companyjuice.com/terms-conditions/'>
            License
          </Link>
          <Link target='_blank' href='https://companyjuice.com/contact/'>
            Support
          </Link>
        </Box>
      )}
    </Box>
  )
}

export default FooterContent
