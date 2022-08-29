// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// Styled component for the wrapper
const Wrapper = styled('div')(({ theme }) => ({
  '& > *': {
    marginRight: `${theme.spacing(6)} !important`
  }
}))

const BadgesMaxValue = () => {
  return (
    <Wrapper className='demo-space-x'>
      <Badge badgeContent={99} color='primary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={100} color='primary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge badgeContent={1000} max={999} color='primary'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
    </Wrapper>
  )
}

export default BadgesMaxValue
