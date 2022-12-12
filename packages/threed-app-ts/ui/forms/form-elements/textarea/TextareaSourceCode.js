export const TextareaBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextareaAutosize from '@mui/material/TextareaAutosize'

const TextareaBasic = () => {
  return (
    <form noValidate autoComplete='off'>
      <Grid container spacing={4}>
        <Grid item>
          <Typography sx={{ mb: 2, fontWeight: 500 }}>Simple</Typography>
          <TextareaAutosize aria-label='empty textarea' placeholder='Empty' />
        </Grid>
        <Grid item>
          <Typography sx={{ mb: 2, fontWeight: 500 }}>Minimum Rows</Typography>
          <TextareaAutosize aria-label='minimum height' minRows={3} placeholder='Minimum 3 rows' />
        </Grid>
        <Grid item>
          <Typography sx={{ mb: 2, fontWeight: 500 }}>Maximum Rows</Typography>
          <TextareaAutosize
            maxRows={4}
            aria-label='maximum height'
            placeholder='Maximum 4 rows'
            defaultValue='Cupcake ipsum dolor sit amet wafer halvah ice cream. Macaroon bear claw pudding cheesecake. Chupa chups powder soufflé powder.'
          />
        </Grid>
      </Grid>
    </form>
  )
}

export default TextareaBasic
`}</code>
  </pre>
)

export const TextareaVariantJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)
