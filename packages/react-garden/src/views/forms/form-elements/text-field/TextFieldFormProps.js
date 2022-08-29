// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldFormProps = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField required id='form-props-required' label='Required' defaultValue='Hello World' />
      <TextField disabled id='form-props-disabled' label='Disabled' defaultValue='Hello World' />
      <TextField type='password' label='Password' id='form-props-password-input' autoComplete='current-password' />
      <TextField
        label='Read Only'
        defaultValue='Hello World'
        id='form-props-read-only-input'
        InputProps={{ readOnly: true }}
      />
      <TextField type='number' label='Number' id='form-props-number' InputLabelProps={{ shrink: true }} />
      <TextField
        label='Label'
        placeholder='Placeholder'
        id='form-props-full-width'
        InputLabelProps={{ shrink: true }}
      />
      <TextField id='form-props-search' label='Search field' type='search' />
      <TextField
        label='Helper text'
        id='form-props-helperText'
        defaultValue='Default Value'
        helperText='Some important text'
      />
    </form>
  )
}

export default TextFieldFormProps
