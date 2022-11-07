// ** MUI Imports
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
