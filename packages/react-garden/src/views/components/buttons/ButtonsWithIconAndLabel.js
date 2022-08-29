// ** MUI Imports
import Button from '@mui/material/Button'

// ** Icons Imports
import Send from 'mdi-material-ui/Send'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'

const ButtonsWithIconAndLabel = () => {
  return (
    <div className='demo-space-x'>
      <Button variant='contained' endIcon={<Send />}>
        Send
      </Button>
      <Button variant='contained' color='secondary' startIcon={<DeleteOutline />}>
        Delete
      </Button>
    </div>
  )
}

export default ButtonsWithIconAndLabel
