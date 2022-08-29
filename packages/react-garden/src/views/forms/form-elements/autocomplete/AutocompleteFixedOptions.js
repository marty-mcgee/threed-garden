// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const fixedOptions = [top100Films[6]]

const AutocompleteFixedOptions = () => {
  // ** State
  const [value, setValue] = useState([...fixedOptions, top100Films[13]])

  return (
    <Autocomplete
      multiple
      value={value}
      options={top100Films}
      id='autocomplete-fixed-option'
      getOptionLabel={option => option.title}
      renderInput={params => <TextField {...params} label='Fixed tag' placeholder='Favorites' />}
      onChange={(event, newValue) => {
        setValue([...fixedOptions, ...newValue.filter(option => fixedOptions.indexOf(option) === -1)])
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option.title}
            {...getTagProps({ index })}
            disabled={fixedOptions.indexOf(option) !== -1}
            key={index}
          />
        ))
      }
    />
  )
}

export default AutocompleteFixedOptions
