// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'

const BadgesDot = () => {
  return (
    <div className='demo-space-x'>
      <Badge variant='dot' color='primary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge variant='dot' color='secondary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge variant='dot' color='error'>
        <Typography>Typography</Typography>
      </Badge>
    </div>
  )
}

export default BadgesDot
