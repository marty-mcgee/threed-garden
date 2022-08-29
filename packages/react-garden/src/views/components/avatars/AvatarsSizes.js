// ** MUI Imports
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

const AvatarsSizes = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar alt='Victor Anderson' sx={{ width: 25, height: 25 }} src='/images/avatars/3.png' />
      <Avatar alt='Victor Anderson' src='/images/avatars/3.png' />
      <Avatar alt='Victor Anderson' sx={{ width: 56, height: 56 }} src='/images/avatars/3.png' />
    </Box>
  )
}

export default AvatarsSizes
