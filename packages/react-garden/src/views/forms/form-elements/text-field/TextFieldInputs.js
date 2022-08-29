// ** MUI Imports
import Input from '@mui/material/Input'

const TextFieldInputs = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <Input defaultValue='Hello world' inputProps={{ 'aria-label': 'description' }} />
      <Input placeholder='Placeholder' inputProps={{ 'aria-label': 'description' }} />
      <Input defaultValue='Disabled' disabled inputProps={{ 'aria-label': 'description' }} />
      <Input defaultValue='Error' error inputProps={{ 'aria-label': 'description' }} />
    </form>
  )
}

export default TextFieldInputs
