// ** MUI Imports
import Button from '@mui/material/Button'

const ButtonsOutlined = () => {
  return (
    <div className='demo-space-x'>
      <Button variant='outlined'>Primary</Button>
      <Button variant='outlined' color='secondary'>
        Secondary
      </Button>
      <Button variant='outlined' disabled>
        Disabled
      </Button>
      <Button variant='outlined' href='#'>
        Link
      </Button>
    </div>
  )
}

export default ButtonsOutlined
