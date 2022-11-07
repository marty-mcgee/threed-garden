// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

const TextFieldLayout = () => {
  return (
    <Box noValidate component='form' autoComplete='off' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <TextField fullWidth label='Full width' id='outlined-full-width' sx={{ mb: 4 }} />
      <TextField
        label='None'
        sx={{ mr: 4 }}
        id='outlined-margin-none'
        defaultValue='Margin None'
        helperText='Some important text'
      />
      <TextField
        label='Dense'
        margin='dense'
        sx={{ mr: 4 }}
        id='outlined-margin-dense'
        defaultValue='Margin Dense'
        helperText='Some important text'
      />
      <TextField
        label='Normal'
        margin='normal'
        id='outlined-margin-normal'
        defaultValue='Margin Normal'
        helperText='Some important text'
      />
    </Box>
  )
}

export default TextFieldLayout
