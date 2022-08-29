// ** React Imports
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
