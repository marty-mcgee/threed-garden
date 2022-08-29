// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldVariant = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField id='outlined-basic' label='Outlined' />
      <TextField id='filled-basic' label='Filled' variant='filled' />
      <TextField id='standard-basic' label='Standard' variant='standard' />
    </form>
  )
}

export default TextFieldVariant
