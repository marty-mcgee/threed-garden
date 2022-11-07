// ** MUI Imports
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
