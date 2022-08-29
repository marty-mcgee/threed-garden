export const AutocompleteAsynchronousRequestJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'

// ** Third Party Imports
import axios from 'axios'

const sleep = (delay = 0) => {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}

const AutocompleteAsynchronousRequest = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState([])
  const loading = open && options.length === 0
  useEffect(() => {
    let active = true
    if (!loading) {
      return undefined
    }

    const fetchData = async () => {
      const response = await axios.get('/forms/autocomplete')
      await sleep(1000)
      const top100Films = await response.data
      if (active) {
        setOptions(Object.keys(top100Films).map(key => top100Films[key]))
      }
    }
    fetchData()

    return () => {
      active = false
    }
  }, [loading])
  useEffect(() => {
    if (!open) {
      setOptions([])
    }
  }, [open])

  return (
    <Autocomplete
      open={open}
      options={options}
      loading={loading}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      id='autocomplete-asynchronous-request'
      getOptionLabel={option => option.title}
      isOptionEqualToValue={(option, value) => option.title === value.title}
      renderInput={params => (
        <TextField
          {...params}
          label='Asynchronous'
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <Fragment>
                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </Fragment>
            )
          }}
        />
      )}
    />
  )
}

export default AutocompleteAsynchronousRequest
`}</code>
  </pre>
)

export const AutocompleteControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteControlledUncontrolled = () => {
  // ** State
  const [value, setValue] = useState(null)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <Box className='demo-space-x' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <Autocomplete
        value={value}
        sx={{ width: 250 }}
        options={top100Films}
        onChange={handleChange}
        id='autocomplete-controlled'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Controlled' />}
      />
      <Autocomplete
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-uncontrolled'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='Uncontrolled' />}
      />
    </Box>
  )
}

export default AutocompleteControlledUncontrolled
`}</code>
  </pre>
)

export const AutocompleteCountryJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
            src={https://flagcdn.com/w20/{option.code.toLowerCase()}.png}
            srcSet={https://flagcdn.com/w40/{option.code.toLowerCase()}.png 2x}
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
`}</code>
  </pre>
)

export const AutocompleteCreatableJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const filter = createFilterOptions()

const AutocompleteCreatable = () => {
  // ** State
  const [value, setValue] = useState(null)

  return (
    <Autocomplete
      freeSolo
      clearOnBlur
      value={value}
      selectOnFocus
      handleHomeEndKeys
      sx={{ width: 250 }}
      options={top100Films}
      id='autocomplete-free-solo-with-text'
      renderOption={(props, option) => <li {...props}>{option.title}</li>}
      renderInput={params => <TextField {...params} label='Free solo with text demo' />}
      getOptionLabel={option => {
        if (typeof option === 'string') {
          return option
        }
        if (option.inputValue) {
          return option.inputValue
        }

        return option.title
      }}
      onChange={(event, newValue) => {
        if (typeof newValue === 'string') {
          setValue({
            title: newValue
          })
        } else if (newValue && newValue.inputValue) {
          setValue({
            title: newValue.inputValue
          })
        } else {
          setValue(newValue)
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params)
        const { inputValue } = params
        const isExisting = options.some(option => inputValue === option.title)
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            title: Add "{inputValue}"
          })
        }

        return filtered
      }}
    />
  )
}

export default AutocompleteCreatable
`}</code>
  </pre>
)

export const AutocompleteCustomInputJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Autocomplete from '@mui/material/Autocomplete'

const options = ['Option 1', 'Option 2']

const AutocompleteCustomInput = () => {
  return (
    <Autocomplete
      options={options}
      id='autocomplete-custom-input'
      renderInput={params => (
        <div ref={params.InputProps.ref}>
          <input type='text' {...params.inputProps} />
        </div>
      )}
      sx={{
        display: 'inline-block',
        '& input': {
          width: 200,
          backgroundColor: 'background.paper',
          color: theme => theme.palette.getContrastText(theme.palette.background.paper)
        }
      }}
    />
  )
}

export default AutocompleteCustomInput
`}</code>
  </pre>
)

export const AutocompleteCustomFilterJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const filterOptions = createFilterOptions({
  matchFrom: 'start',
  stringify: option => option.title
})

const AutocompleteCustomFilter = () => {
  return (
    <Autocomplete
      options={top100Films}
      filterOptions={filterOptions}
      id='autocomplete-custom-filter'
      getOptionLabel={option => option.title}
      renderInput={params => <TextField {...params} label='Custom filter' />}
    />
  )
}

export default AutocompleteCustomFilter
`}</code>
  </pre>
)

export const AutocompleteCheckboxesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const AutocompleteFixedOptionsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const AutocompleteFreeSoloJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteFreeSolo = () => {
  return (
    <Autocomplete
      freeSolo
      sx={{ width: 250 }}
      id='autocomplete-free-solo'
      options={top100Films.map(option => option.title)}
      renderInput={params => <TextField {...params} label='Free Solo' />}
    />
  )
}

export default AutocompleteFreeSolo
`}</code>
  </pre>
)

export const AutocompleteDisabledOptionsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

const timeSlots = Array.from(new Array(24 * 2)).map(
  (_, index) => {index < 20 ? '0' : ''}{Math.floor(index / 2)}:{index % 2 === 0 ? '00' : '30'}
)

const AutocompleteDisabledOptions = () => {
  return (
    <Autocomplete
      sx={{ width: 250 }}
      options={timeSlots}
      id='autocomplete-disabled-options'
      renderInput={params => <TextField {...params} label='Disabled options' />}
      getOptionDisabled={option => option === timeSlots[0] || option === timeSlots[2]}
    />
  )
}

export default AutocompleteDisabledOptions
`}</code>
  </pre>
)

export const AutocompleteGroupedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteGrouped = () => {
  const options = top100Films.map(option => {
    const firstLetter = option.title[0].toUpperCase()

    return {
      firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
      ...option
    }
  })

  return (
    <Autocomplete
      sx={{ width: 250 }}
      id='autocomplete-grouped'
      groupBy={option => option.firstLetter}
      getOptionLabel={option => option.title}
      renderInput={params => <TextField {...params} label='With categories' />}
      options={options.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
    />
  )
}

export default AutocompleteGrouped
`}</code>
  </pre>
)

export const AutocompleteMultipleValuesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const AutocompleteLimitTagsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteLimitTags = () => {
  return (
    <Autocomplete
      multiple
      limitTags={2}
      options={top100Films}
      id='autocomplete-limit-tags'
      getOptionLabel={option => option.title}
      defaultValue={[top100Films[13], top100Films[12], top100Films[11]]}
      renderInput={params => <TextField {...params} label='limitTags' placeholder='Favorites' />}
    />
  )
}

export default AutocompleteLimitTags
`}</code>
  </pre>
)

export const AutocompletePropsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// ** Data
import { top100Films } from 'src/@fake-db/autocomplete'

const AutocompleteProps = () => {
  return (
    <Box className='demo-space-x' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <Autocomplete
        sx={{ width: 250 }}
        disableCloseOnSelect
        options={top100Films}
        id='autocomplete-disableCloseOnSelect'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='disableCloseOnSelect' />}
      />
      <Autocomplete
        clearOnEscape
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-clearOnEscape'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='clearOnEscape' />}
      />
      <Autocomplete
        disableClearable
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-disableClearable'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='disableClearable' />}
      />
      <Autocomplete
        openOnFocus
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-openOnFocus'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='openOnFocus' />}
      />
      <Autocomplete
        autoHighlight
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-autoHighlight'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='autoHighlight' />}
      />
      <Autocomplete
        autoSelect
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-autoSelect'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='autoSelect' />}
      />
      <Autocomplete
        blurOnSelect
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-blurOnSelect'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='blurOnSelect' />}
      />
      <Autocomplete
        clearOnBlur
        sx={{ width: 250 }}
        options={top100Films}
        id='autocomplete-clearOnBlur'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='clearOnBlur' />}
      />
      <Autocomplete
        sx={{ width: 250 }}
        options={top100Films}
        selectOnFocus={false}
        id='autocomplete-selectOnFocus'
        getOptionLabel={option => option.title}
        renderInput={params => <TextField {...params} label='selectOnFocus={false}' />}
      />
    </Box>
  )
}

export default AutocompleteProps
`}</code>
  </pre>
)

export const AutocompleteVariantsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const AutocompleteSmallSizeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)
