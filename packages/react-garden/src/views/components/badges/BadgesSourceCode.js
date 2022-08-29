export const BadgesBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const BadgesAlignmentJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'

const BadgesAlignment = () => {
  return (
    <div className='demo-space-x'>
      <Badge color='primary' variant='dot'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge color='primary' variant='dot' anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge color='primary' variant='dot' anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge color='primary' variant='dot' anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
    </div>
  )
}

export default BadgesAlignment
`}</code>
  </pre>
)

export const BadgesDotJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const BadgesLightJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// ** Custom Components Imports
import CustomBadge from 'src/@core/components/mui/badge'

// Styled component for a wrapper
const Wrapper = styled('div')(({ theme }) => ({
  '& > *': {
    marginRight: {theme.spacing(6)} !important
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
`}</code>
  </pre>
)

export const BadgesMaxValueJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// Styled component for the wrapper
const Wrapper = styled('div')(({ theme }) => ({
  '& > *': {
    marginRight: {theme.spacing(6)} !important
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
`}</code>
  </pre>
)

export const BadgesOverlapJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

// Styled component for the wrapper
const Wrapper = styled('div')(({ theme }) => ({
  '& > *': {
    marginRight: {theme.spacing(6)} !important
  }
}))

const BadgesOverlap = () => {
  return (
    <Wrapper className='demo-space-x'>
      <Badge color='primary' badgeContent=' '>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' variant='square' />
      </Badge>
      <Badge color='primary' variant='dot'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' variant='square' />
      </Badge>
      <Badge color='primary' overlap='circular' badgeContent=' '>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
      <Badge color='primary' overlap='circular' variant='dot'>
        <Avatar src='/images/avatars/1.png' alt='User Avatar' />
      </Badge>
    </Wrapper>
  )
}

export default BadgesOverlap
`}</code>
  </pre>
)

export const BadgesVisibilityJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState, Fragment } from 'react'

// ** MUI Imports
import Badge from '@mui/material/Badge'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'
import ButtonGroup from '@mui/material/ButtonGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import Plus from 'mdi-material-ui/Plus'
import Minus from 'mdi-material-ui/Minus'

// Styled component for a wrapper
const Wrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& > *': {
    marginRight: {theme.spacing(6)} !important
  }
}))

const BadgesVisibility = () => {
  // ** States
  const [count, setCount] = useState(1)
  const [invisible, setInvisible] = useState(false)

  const handleBadgeVisibility = () => {
    setInvisible(!invisible)
  }

  return (
    <Fragment>
      <Wrapper className='demo-space-x'>
        <Badge badgeContent={count} color='primary'>
          <Avatar src='/images/avatars/1.png' alt='User Avatar' />
        </Badge>
        <ButtonGroup size='small'>
          <Button aria-label='reduce' onClick={() => setCount(Math.max(count - 1, 0))}>
            <Minus fontSize='small' />
          </Button>
          <Button aria-label='increase' onClick={() => setCount(count + 1)}>
            <Plus fontSize='small' />
          </Button>
        </ButtonGroup>
      </Wrapper>

      <Wrapper className='demo-space-x'>
        <Badge variant='dot' color='primary' invisible={invisible}>
          <Avatar src='/images/avatars/1.png' alt='User Avatar' />
        </Badge>
        <FormControlLabel
          label='Show Badge'
          control={<Switch color='primary' checked={!invisible} onChange={handleBadgeVisibility} />}
        />
      </Wrapper>
    </Fragment>
  )
}

export default BadgesVisibility
`}</code>
  </pre>
)
