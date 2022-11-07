// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FilledInput from '@mui/material/FilledInput'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'

const TextFieldComponents = () => {
  // ** State
  const [name, setName] = useState('Composed TextField')

  const handleChange = event => {
    setName(event.target.value)
  }

  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel htmlFor='component-simple'>Name</InputLabel>
        <Input id='component-simple' value={name} onChange={handleChange} />
      </FormControl>
      <FormControl variant='standard'>
        <InputLabel htmlFor='component-helper'>Name</InputLabel>
        <Input id='component-helper' value={name} onChange={handleChange} aria-describedby='component-helper-text' />
        <FormHelperText id='component-helper-text'>Some important helper text</FormHelperText>
      </FormControl>
      <FormControl disabled variant='standard'>
        <InputLabel htmlFor='component-disabled'>Name</InputLabel>
        <Input id='component-disabled' value={name} onChange={handleChange} />
        <FormHelperText>Disabled</FormHelperText>
      </FormControl>
      <FormControl error variant='standard'>
        <InputLabel htmlFor='component-error'>Name</InputLabel>
        <Input id='component-error' value={name} onChange={handleChange} aria-describedby='component-error-text' />
        <FormHelperText id='component-error-text'>Error</FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor='component-outlined'>Name</InputLabel>
        <OutlinedInput id='component-outlined' value={name} onChange={handleChange} label='Name' />
      </FormControl>
      <FormControl variant='filled'>
        <InputLabel htmlFor='component-filled'>Name</InputLabel>
        <FilledInput id='component-filled' value={name} onChange={handleChange} />
      </FormControl>
    </form>
  )
}

export default TextFieldComponents
