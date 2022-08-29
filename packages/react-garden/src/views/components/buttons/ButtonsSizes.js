// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import CameraIris from 'mdi-material-ui/CameraIris'

const ButtonsSizes = () => {
  return (
    <Fragment>
      <div className='demo-space-x'>
        <Button variant='text' size='small'>
          Small
        </Button>
        <Button variant='text' size='medium'>
          Medium
        </Button>
        <Button variant='text' size='large'>
          Large
        </Button>
      </div>
      <div className='demo-space-x'>
        <Button variant='outlined' size='small'>
          Small
        </Button>
        <Button variant='outlined' size='medium'>
          Medium
        </Button>
        <Button variant='outlined' size='large'>
          Large
        </Button>
      </div>
      <div className='demo-space-x'>
        <Button variant='contained' size='small'>
          Small
        </Button>
        <Button variant='contained' size='medium'>
          Medium
        </Button>
        <Button variant='contained' size='large'>
          Large
        </Button>
      </div>
      <div className='demo-space-x'>
        <IconButton aria-label='capture screenshot' color='secondary' size='small'>
          <CameraIris fontSize='inherit' />
        </IconButton>
        <IconButton aria-label='capture screenshot' color='secondary'>
          <CameraIris fontSize='small' />
        </IconButton>
        <IconButton aria-label='capture screenshot' color='secondary'>
          <CameraIris />
        </IconButton>
        <IconButton aria-label='capture screenshot' color='secondary' size='large'>
          <CameraIris fontSize='large' />
        </IconButton>
      </div>
    </Fragment>
  )
}

export default ButtonsSizes
