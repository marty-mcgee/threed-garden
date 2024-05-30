export const AlertsBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Alert from '@mui/material/Alert'

const AlertsBasic = () => {
  return (
    <div className='demo-space-y'>
      <Alert severity='error'>This is an error alert — check it out!</Alert>
      <Alert severity='warning'>This is an warning alert — check it out!</Alert>
      <Alert severity='info'>This is an info alert — check it out!</Alert>
      <Alert severity='success'>This is an success alert — check it out!</Alert>
    </div>
  )
}

export default AlertsBasic
`}</code>
  </pre>
)

export const AlertsActionsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

const AlertsBasic = () => {
  return (
    <div className='demo-space-y'>
      <Alert
        onClose={e => {
          e.preventDefault()
        }}
      >
        This is a success alert — check it out!
      </Alert>
      <Alert
        action={
          <Button color='inherit' size='small'>
            UNDO
          </Button>
        }
        variant='outlined'
      >
        This is a success alert — check it out!
      </Alert>
      <Alert
        action={
          <Button color='inherit' size='small'>
            UNDO
          </Button>
        }
        variant='filled'
      >
        This is a success alert — check it out!
      </Alert>
    </div>
  )
}

export default AlertsBasic
`}</code>
  </pre>
)

export const AlertsFilledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Alert from '@mui/material/Alert'

const AlertsFilled = () => {
  return (
    <div className='demo-space-y'>
      <Alert variant='filled' severity='error'>
        This is an error alert — check it out!
      </Alert>
      <Alert variant='filled' severity='warning'>
        This is an warning alert — check it out!
      </Alert>
      <Alert variant='filled' severity='info'>
        This is an info alert — check it out!
      </Alert>
      <Alert variant='filled' severity='success'>
        This is an success alert — check it out!
      </Alert>
    </div>
  )
}

export default AlertsFilled
`}</code>
  </pre>
)

export const AlertsDescriptionJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

const AlertsDescription = () => {
  return (
    <div className='demo-space-y'>
      <Alert severity='error'>
        <AlertTitle>Error</AlertTitle>
        This is an error alert — <strong>check it out!</strong>
      </Alert>
      <Alert severity='warning'>
        <AlertTitle>Warning</AlertTitle>
        This is an warning alert — <strong>check it out!</strong>
      </Alert>
      <Alert severity='info'>
        <AlertTitle>Info</AlertTitle>
        This is an info alert — <strong>check it out!</strong>
      </Alert>
      <Alert severity='success'>
        <AlertTitle>Success</AlertTitle>
        This is an success alert — <strong>check it out!</strong>
      </Alert>
    </div>
  )
}

export default AlertsDescription
`}</code>
  </pre>
)

export const AlertsOutlinedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Alert from '@mui/material/Alert'

const AlertsOutlined = () => {
  return (
    <div className='demo-space-y'>
      <Alert variant='outlined' severity='error'>
        This is an error alert — check it out!
      </Alert>
      <Alert variant='outlined' severity='warning'>
        This is an warning alert — check it out!
      </Alert>
      <Alert variant='outlined' severity='info'>
        This is an info alert — check it out!
      </Alert>
      <Alert variant='outlined' severity='success'>
        This is an success alert — check it out!
      </Alert>
    </div>
  )
}

export default AlertsOutlined
`}</code>
  </pre>
)

export const AlertsDismissibleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)
