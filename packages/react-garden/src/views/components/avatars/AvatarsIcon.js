// ** MUI Imports
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

// ** Icons Imports
import Cached from 'mdi-material-ui/Cached'
import FolderOutline from 'mdi-material-ui/FolderOutline'
import CheckboxMarkedCircleOutline from 'mdi-material-ui/CheckboxMarkedCircleOutline'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const AvatarsIcon = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex' }}>
      <Avatar>
        <FolderOutline />
      </Avatar>
      <CustomAvatar color='success'>
        <Cached />
      </CustomAvatar>
      <CustomAvatar skin='light' color='info'>
        <CheckboxMarkedCircleOutline />
      </CustomAvatar>
    </Box>
  )
}

export default AvatarsIcon
