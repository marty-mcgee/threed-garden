// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesShowError = () => {
  // ** State
  const [state, setState] = useState({
    gilad: true,
    jason: false,
    antoine: false
  })

  // ** Vars
  const { gilad, jason, antoine } = state
  const error = [gilad, jason, antoine].filter(v => v).length !== 2

  const handleChange = event => {
    setState({ ...state, [event.target.name]: event.target.checked })
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <FormControl sx={{ mt: 4, mr: 4 }}>
        <FormLabel>Assign responsibility</FormLabel>
        <FormGroup>
          <FormControlLabel
            label='Gilad Gray'
            control={<Checkbox checked={gilad} onChange={handleChange} name='gilad' />}
          />
          <FormControlLabel
            label='Jason Killian'
            control={<Checkbox checked={jason} onChange={handleChange} name='jason' />}
          />
          <FormControlLabel
            label='Antoine Llorca'
            control={<Checkbox checked={antoine} onChange={handleChange} name='antoine' />}
          />
        </FormGroup>
        <FormHelperText>Be careful</FormHelperText>
      </FormControl>
      <FormControl required error={error} sx={{ mt: 4 }}>
        <FormLabel>Pick two</FormLabel>
        <FormGroup>
          <FormControlLabel
            label='Gilad Gray'
            control={<Checkbox checked={gilad} onChange={handleChange} name='gilad' />}
          />
          <FormControlLabel
            label='Jason Killian'
            control={<Checkbox checked={jason} onChange={handleChange} name='jason' />}
          />
          <FormControlLabel
            label='Antoine Llorca'
            control={<Checkbox checked={antoine} onChange={handleChange} name='antoine' />}
          />
        </FormGroup>
        <FormHelperText>You can display an error</FormHelperText>
      </FormControl>
    </Box>
  )
}

export default CheckboxesShowError
