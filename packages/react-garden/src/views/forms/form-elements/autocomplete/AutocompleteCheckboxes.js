// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteCheckboxes = () => {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={top100Films}
      id='autocomplete-checkboxes'
      getOptionLabel={option => option.title}
      renderInput={params => <TextField {...params} label='Checkboxes' placeholder='Favorites' />}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox checked={selected} sx={{ mr: 2 }} />
          {option.title}
        </li>
      )}
    />
  )
}

export default AutocompleteCheckboxes
