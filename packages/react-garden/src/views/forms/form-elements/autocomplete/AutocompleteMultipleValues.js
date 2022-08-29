// ** MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteMultipleValues = () => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <Autocomplete
        multiple
        options={top100Films}
        filterSelectedOptions
        defaultValue={[top100Films[13]]}
        id='autocomplete-multiple-outlined'
        getOptionLabel={option => option.title}
        sx={{ width: 250, mt: 5, mr: 5 }}
        renderInput={params => <TextField {...params} label='filterSelectedOptions' placeholder='Favorites' />}
      />
      <Autocomplete
        freeSolo
        multiple
        id='autocomplete-multiple-filled'
        defaultValue={[top100Films[13].title]}
        sx={{ width: 250, mt: 5, mr: 5 }}
        options={top100Films.map(option => option.title)}
        renderInput={params => <TextField {...params} variant='filled' label='freeSolo' placeholder='Favorites' />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip variant='outlined' label={option} {...getTagProps({ index })} key={index} />
          ))
        }
      />
      <Autocomplete
        multiple
        options={top100Films}
        defaultValue={[top100Films[13]]}
        sx={{ width: 250, mt: 5 }}
        id='autocomplete-multiple-standard'
        getOptionLabel={option => option.title}
        renderInput={params => (
          <TextField {...params} label='Multiple values' placeholder='Favorites' variant='standard' />
        )}
      />
    </Box>
  )
}

export default AutocompleteMultipleValues
