// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteVariants = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <Autocomplete
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-outlined'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Combo box' />}
      />
      <Autocomplete
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-filled'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Combo box' variant='filled' />}
      />
      <Autocomplete
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-default'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Combo box' variant='standard' />}
      />
      <Autocomplete
        disabled
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-disabled'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Disabled' />}
      />
    </Box>
  )
}

export default AutocompleteVariants
