// ** MUI Imports
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import CameraIris from 'mdi-material-ui/CameraIris'

const ButtonsIcons = () => {
  return (
    <div className='demo-space-x'>
      <IconButton aria-label='capture screenshot'>
        <CameraIris />
      </IconButton>
      <IconButton aria-label='capture screenshot' color='primary'>
        <CameraIris />
      </IconButton>
      <IconButton aria-label='capture screenshot' color='secondary'>
        <CameraIris />
      </IconButton>
      <IconButton aria-label='capture screenshot' disabled>
        <CameraIris />
      </IconButton>
    </div>
  )
}

export default ButtonsIcons
