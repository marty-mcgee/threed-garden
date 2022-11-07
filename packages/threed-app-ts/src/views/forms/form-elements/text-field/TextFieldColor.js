// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldColor = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField id='color-outlined' label='Outlined success' color='success' />
      <TextField id='color-filled' label='Filled success' variant='filled' color='success' />
      <TextField id='color-standard' label='Standard success' color='success' variant='standard' />
    </form>
  )
}

export default TextFieldColor
