// ** MUI Imports
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
