// ** MUI Imports
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// ** Custom Components Imports
import CustomBadge from 'src/@core/components/mui/badge'

// Styled component for a wrapper
const Wrapper = styled('div')(({ theme }) => ({
  '& > *': {
    marginRight: `${theme.spacing(6)} !important`
  }
}))

const BadgesLight = () => {
  return (
    <Wrapper className='demo-space-x'>
      <CustomBadge skin='light' color='primary' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
      <CustomBadge skin='light' color='secondary' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
      <CustomBadge skin='light' color='success' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
      <CustomBadge skin='light' color='error' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
      <CustomBadge skin='light' color='warning' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
      <CustomBadge skin='light' color='info' badgeContent={4}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </CustomBadge>
    </Wrapper>
  )
}

export default BadgesLight
