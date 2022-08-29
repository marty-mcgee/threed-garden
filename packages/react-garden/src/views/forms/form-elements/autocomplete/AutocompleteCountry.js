// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { countries } from 'src/@fake-db/autocomplete'

const AutocompleteCountry = () => {
  return (
    <Autocomplete
      autoHighlight
      sx={{ width: 250 }}
      id='autocomplete-country-select'
      options={countries}
      getOptionLabel={option => option.label}
      renderOption={(props, option) => (
        <Box component='li' sx={{ '& > img': { mr: 4, flexShrink: 0 } }} {...props}>
          <img
            alt=''
            width='20'
            loading='lazy'
            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
          />
          {option.label} ({option.code}) +{option.phone}
        </Box>
      )}
      renderInput={params => (
        <TextField
          {...params}
          label='Choose a country'
          inputProps={{
            ...params.inputProps,
            autoComplete: 'new-password'
          }}
        />
      )}
    />
  )
}

export default AutocompleteCountry
