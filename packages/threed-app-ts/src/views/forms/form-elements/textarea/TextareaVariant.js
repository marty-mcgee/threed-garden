// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

const TextareaVariant = () => {
  // ** State
  const [value, setValue] = useState('Controlled')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <form noValidate autoComplete='off'>
      <Box className='demo-space-x' sx={{ mb: 4 }}>
        <TextField
          multiline
          maxRows={4}
          value={value}
          label='Multiline'
          onChange={handleChange}
          id='textarea-outlined-controlled'
        />
        <TextField multiline id='textarea-outlined' placeholder='Placeholder' label='Multiline Placeholder' />
        <TextField rows={4} multiline label='Multiline' defaultValue='Default Value' id='textarea-outlined-static' />
      </Box>
      <Box className='demo-space-x' sx={{ mb: 4 }}>
        <TextField
          multiline
          maxRows={4}
          value={value}
          variant='filled'
          label='Multiline'
          onChange={handleChange}
          id='textarea-filled-controlled'
        />
        <TextField
          multiline
          variant='filled'
          id='textarea-filled'
          placeholder='Placeholder'
          label='Multiline Placeholder'
        />
        <TextField
          rows={4}
          multiline
          variant='filled'
          label='Multiline'
          id='textarea-filled-static'
          defaultValue='Default Value'
        />
      </Box>
      <div className='demo-space-x'>
        <TextField
          multiline
          maxRows={4}
          value={value}
          label='Multiline'
          variant='standard'
          onChange={handleChange}
          id='textarea-standard-controlled'
        />
        <TextField
          multiline
          variant='standard'
          id='textarea-standard'
          placeholder='Placeholder'
          label='Multiline Placeholder'
        />
        <TextField
          rows={4}
          multiline
          label='Multiline'
          variant='standard'
          defaultValue='Default Value'
          id='textarea-standard-static'
        />
      </div>
    </form>
  )
}

export default TextareaVariant
