// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteSmallSize = () => {
  return (
    <div>
      <Autocomplete
        size='small'
        options={top100Films}
        id='autocomplete-size-small'
        defaultValue={top100Films[13]}
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Size small' placeholder='Favorites' />}
      />
      <Autocomplete
        multiple
        size='small'
        sx={{ mt: 5 }}
        options={top100Films}
        defaultValue={[top100Films[13]]}
        id='autocomplete-size-small-multi'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Size small' placeholder='Favorites' />}
      />
    </div>
  )
}

export default AutocompleteSmallSize
