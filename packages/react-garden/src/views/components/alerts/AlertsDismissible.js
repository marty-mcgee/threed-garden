// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Fade from '@mui/material/Fade'
import Grow from '@mui/material/Grow'
import Alert from '@mui/material/Alert'
import Slide from '@mui/material/Slide'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'

const AlertsDismissible = () => {
  // ** States
  const [open1, setOpen1] = useState(true)
  const [open2, setOpen2] = useState(true)
  const [open3, setOpen3] = useState(true)
  const [open4, setOpen4] = useState(true)

  return (
    <>
      <Box sx={{ mb: 6 }}>
        <Collapse in={open1}>
          <Alert
            action={
              <IconButton size='small' color='inherit' aria-label='close' onClick={() => setOpen1(false)}>
                <Close fontSize='inherit' />
              </IconButton>
            }
          >
            Close me!
          </Alert>
        </Collapse>
        <Button disabled={open1} variant='outlined' sx={{ mt: 2 }} onClick={() => setOpen1(true)}>
          Open Collapse
        </Button>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Fade in={open2} {...(open2 ? { timeout: 700 } : {})}>
          <Alert
            action={
              <IconButton size='small' color='inherit' aria-label='close' onClick={() => setOpen2(false)}>
                <Close fontSize='inherit' />
              </IconButton>
            }
          >
            Close me!
          </Alert>
        </Fade>
        <Button disabled={open2} variant='outlined' sx={{ mt: 2 }} onClick={() => setOpen2(true)}>
          Open Fade
        </Button>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Grow in={open3} {...(open3 ? { timeout: 700 } : {})}>
          <Alert
            action={
              <IconButton size='small' color='inherit' aria-label='close' onClick={() => setOpen3(false)}>
                <Close fontSize='inherit' />
              </IconButton>
            }
          >
            Close me!
          </Alert>
        </Grow>
        <Button disabled={open3} variant='outlined' sx={{ mt: 2 }} onClick={() => setOpen3(true)}>
          Open Grow
        </Button>
      </Box>

      <Box>
        <Slide in={open4} direction='left' {...(open4 ? { timeout: 500 } : {})}>
          <Alert
            action={
              <IconButton size='small' color='inherit' aria-label='close' onClick={() => setOpen4(false)}>
                <Close fontSize='inherit' />
              </IconButton>
            }
          >
            Close me!
          </Alert>
        </Slide>
        <Button disabled={open4} variant='outlined' sx={{ mt: 2 }} onClick={() => setOpen4(true)}>
          Open Slide
        </Button>
      </Box>
    </>
  )
}

export default AlertsDismissible
