// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Grow from '@mui/material/Grow'
import Fade from '@mui/material/Fade'
import Slide from '@mui/material/Slide'

const GrowTransition = props => {
  return <Grow {...props} />
}

const SlideTransition = props => {
  return <Slide {...props} direction='up' />
}

const SnackbarTransition = () => {
  // ** State
  const [state, setState] = useState({
    open: false,
    Transition: Fade
  })

  const handleClick = Transition => () => {
    setState({
      open: true,
      Transition
    })
  }

  const handleClose = () => {
    setState({
      ...state,
      open: false
    })
  }

  return (
    <Fragment>
      <div className='demo-space-x'>
        <Button variant='outlined' onClick={handleClick(GrowTransition)}>
          Grow Transition
        </Button>
        <Button variant='outlined' onClick={handleClick(Fade)}>
          Fade Transition
        </Button>
        <Button variant='outlined' onClick={handleClick(SlideTransition)}>
          Slide Transition
        </Button>
      </div>
      <Snackbar
        open={state.open}
        onClose={handleClose}
        message='I love snacks'
        autoHideDuration={3000}
        key={state.Transition.name}
        TransitionComponent={state.Transition}
      />
    </Fragment>
  )
}

export default SnackbarTransition
