// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'

const SnackbarSimple = () => {
  // ** State
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  return (
    <Fragment>
      <Button variant='outlined' onClick={handleClick}>
        Open simple snackbar
      </Button>
      <Snackbar
        open={open}
        onClose={handleClose}
        message='Note archived'
        autoHideDuration={3000}
        action={
          <Fragment>
            <Button size='small' onClick={handleClose}>
              UNDO
            </Button>
            <IconButton size='small' aria-label='close' color='inherit' onClick={handleClose}>
              <Close fontSize='small' />
            </IconButton>
          </Fragment>
        }
      />
    </Fragment>
  )
}

export default SnackbarSimple
