// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'

const BadgesBasic = () => {
  return (
    <div className='demo-space-x'>
      <Badge badgeContent={4} color='primary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={4} color='secondary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={4} color='success'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={4} color='error'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={4} color='warning'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={4} color='info'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
    </div>
  )
}

export default BadgesBasic
