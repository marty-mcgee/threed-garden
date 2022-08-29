// ** MUI Imports
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

// ** Icons Imports
import ArchiveOutline from 'mdi-material-ui/ArchiveOutline'

const ChipsAvatar = () => {
  return (
    <div className='demo-space-x'>
      <Chip label='Default' avatar={<Avatar />} />
      <Chip label='Howard Paul' avatar={<Avatar src='/images/avatars/7.png' alt='User Avatar' />} />
      <Chip label='Maurice Bell' avatar={<Avatar>M</Avatar>} />
      <Chip
        label='Archived'
        avatar={
          <Avatar>
            <ArchiveOutline fontSize='small' />
          </Avatar>
        }
      />
    </div>
  )
}

export default ChipsAvatar
