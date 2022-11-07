// ** MUI Imports
import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// Styled component for badge content area
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const AvatarsWithBadge = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex' }}>
      <Badge
        overlap='circular'
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Avatar alt='Marie Garza' src='/images/avatars/2.png' />
      </Badge>
      <Badge
        overlap='circular'
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        badgeContent={
          <Avatar
            alt='Marie Garza'
            src='/images/avatars/2.png'
            sx={{ width: 22, height: 22, border: theme => `2px solid ${theme.palette.background.paper}` }}
          />
        }
      >
        <Avatar alt='Olivia Sparks' src='/images/avatars/4.png' />
      </Badge>
    </Box>
  )
}

export default AvatarsWithBadge
