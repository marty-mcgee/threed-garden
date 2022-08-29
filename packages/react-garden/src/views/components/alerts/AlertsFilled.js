// ** MUI Imports
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
