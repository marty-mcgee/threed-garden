// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldSizes = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField label='Size' id='size-small' defaultValue='Small' size='small' />
      <TextField label='Size' id='size-normal' defaultValue='Normal' />
    </form>
  )
}

export default TextFieldSizes
