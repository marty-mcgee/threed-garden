export const AvatarsIconJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const AvatarsGroupedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'

const AvatarsGrouped = () => {
  return (
    <div className='demo-space-y'>
      <AvatarGroup max={4}>
        <Avatar src='/images/avatars/4.png' alt='Olivia Sparks' />
        <Avatar src='/images/avatars/5.png' alt='Howard Lloyd' />
        <Avatar src='/images/avatars/6.png' alt='Hallie Richards' />
        <Avatar src='/images/avatars/8.png' alt='Alice Cobb' />
        <Avatar src='/images/avatars/7.png' alt='Jeffery Warner' />
      </AvatarGroup>
      <AvatarGroup max={4} sx={{ justifyContent: 'center' }}>
        <Avatar src='/images/avatars/4.png' alt='Olivia Sparks' />
        <Avatar src='/images/avatars/5.png' alt='Howard Lloyd' />
        <Avatar src='/images/avatars/6.png' alt='Hallie Richards' />
        <Avatar src='/images/avatars/8.png' alt='Alice Cobb' />
        <Avatar src='/images/avatars/7.png' alt='Jeffery Warner' />
      </AvatarGroup>
      <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
        <Avatar src='/images/avatars/4.png' alt='Olivia Sparks' />
        <Avatar src='/images/avatars/5.png' alt='Howard Lloyd' />
        <Avatar src='/images/avatars/6.png' alt='Hallie Richards' />
        <Avatar src='/images/avatars/8.png' alt='Alice Cobb' />
        <Avatar src='/images/avatars/7.png' alt='Jeffery Warner' />
      </AvatarGroup>
    </div>
  )
}

export default AvatarsGrouped
`}</code>
  </pre>
)

export const AvatarsLetterJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import MuiAvatar from '@mui/material/Avatar'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const AvatarsLetter = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex' }}>
      <MuiAvatar>H</MuiAvatar>
      <CustomAvatar>N</CustomAvatar>
      <CustomAvatar skin='light' color='error'>
        OP
      </CustomAvatar>
      <CustomAvatar skin='light-static' color='error'>
        AB
      </CustomAvatar>
    </Box>
  )
}

export default AvatarsLetter
`}</code>
  </pre>
)

export const AvatarsImageJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

const AvatarsImage = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex' }}>
      <Avatar src='/images/avatars/1.png' alt='Victor Anderson' />
      <Avatar src='/images/avatars/8.png' alt='Alice Cobb' />
      <Avatar src='/images/avatars/7.png' alt='Jeffery Warner' />
    </Box>
  )
}

export default AvatarsImage
`}</code>
  </pre>
)

export const AvatarsVariantsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Icons Imports
import BellOutline from 'mdi-material-ui/BellOutline'
import ContentSaveOutline from 'mdi-material-ui/ContentSaveOutline'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const AvatarsVariants = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex' }}>
      <CustomAvatar variant='square'>
        <BellOutline />
      </CustomAvatar>
      <CustomAvatar color='success' variant='rounded'>
        <ContentSaveOutline />
      </CustomAvatar>
      <CustomAvatar skin='light' variant='square'>
        <BellOutline />
      </CustomAvatar>
      <CustomAvatar skin='light' color='success' variant='rounded'>
        <ContentSaveOutline />
      </CustomAvatar>
    </Box>
  )
}

export default AvatarsVariants
`}</code>
  </pre>
)

export const AvatarsWithBadgeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  boxShadow: 0 0 0 2px {theme.palette.background.paper}
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
            sx={{ width: 22, height: 22, border: theme => 2px solid {theme.palette.background.paper} }}
          />
        }
      >
        <Avatar alt='Olivia Sparks' src='/images/avatars/4.png' />
      </Badge>
    </Box>
  )
}

export default AvatarsWithBadge
`}</code>
  </pre>
)

export const AvatarsSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)
