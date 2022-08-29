// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'

const ButtonsColors = () => {
  return (
    <Fragment>
      <div className='demo-space-x'>
        <Button color='success'>Success</Button>
        <Button color='error'>Error</Button>
        <Button color='warning'>Warning</Button>
        <Button color='info'>Info</Button>
      </div>
      <div className='demo-space-x'>
        <Button variant='outlined' color='success'>
          Success
        </Button>
        <Button variant='outlined' color='error'>
          Error
        </Button>
        <Button variant='outlined' color='warning'>
          Warning
        </Button>
        <Button variant='outlined' color='info'>
          Info
        </Button>
      </div>
      <div className='demo-space-x'>
        <Button variant='contained' color='success'>
          Success
        </Button>
        <Button variant='contained' color='error'>
          Error
        </Button>
        <Button variant='contained' color='warning'>
          Warning
        </Button>
        <Button variant='contained' color='info'>
          Info
        </Button>
      </div>
    </Fragment>
  )
}

export default ButtonsColors
