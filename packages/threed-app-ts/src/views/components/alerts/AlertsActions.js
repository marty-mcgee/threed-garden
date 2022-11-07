// ** MUI Imports
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
