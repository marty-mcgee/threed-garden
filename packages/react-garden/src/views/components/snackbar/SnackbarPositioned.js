// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'

const SnackbarPositioned = () => {
  // ** States
  const [state, setState] = useState({
    open: false,
    vertical: 'top',
    horizontal: 'center'
  })
  const { vertical, horizontal, open } = state

  const handleClick = newState => () => {
    setState({ open: true, ...newState })
  }

  const handleClose = () => {
    setState({ ...state, open: false })
  }

  return (
    <Fragment>
      <div className='demo-space-x'>
        <Button variant='outlined' onClick={handleClick({ vertical: 'top', horizontal: 'center' })}>
          Top Center
        </Button>
        <Button variant='outlined' onClick={handleClick({ vertical: 'top', horizontal: 'right' })}>
          Top Right
        </Button>
        <Button variant='outlined' onClick={handleClick({ vertical: 'bottom', horizontal: 'right' })}>
          Bottom Right
        </Button>
        <Button variant='outlined' onClick={handleClick({ vertical: 'bottom', horizontal: 'center' })}>
          Bottom Center
        </Button>
        <Button variant='outlined' onClick={handleClick({ vertical: 'bottom', horizontal: 'left' })}>
          Bottom Left
        </Button>
        <Button variant='outlined' onClick={handleClick({ vertical: 'top', horizontal: 'left' })}>
          Top Left
        </Button>
      </div>
      <Snackbar
        open={open}
        onClose={handleClose}
        message='I love snacks'
        autoHideDuration={3000}
        key={vertical + horizontal}
        anchorOrigin={{ vertical, horizontal }}
      />
    </Fragment>
  )
}

export default SnackbarPositioned
