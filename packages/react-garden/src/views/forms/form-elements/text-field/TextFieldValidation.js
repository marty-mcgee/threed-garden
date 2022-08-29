// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldValidation = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField error id='validation-error' label='Error' defaultValue='Hello World' />
      <TextField
        error
        label='Error'
        defaultValue='Hello World'
        helperText='Incorrect entry.'
        id='validation-error-helper-text'
      />
    </form>
  )
}

export default TextFieldValidation
