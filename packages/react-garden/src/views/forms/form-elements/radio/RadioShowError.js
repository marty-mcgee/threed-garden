// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioShowError = () => {
  // ** States
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [helperText, setHelperText] = useState('Choose wisely')

  const handleRadioChange = event => {
    setError(false)
    setHelperText(' ')
    setValue(event.target.value)
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (value === 'best') {
      setError(false)
      setHelperText('You got it!')
    } else if (value === 'worst') {
      setError(true)
      setHelperText('Sorry, wrong answer!')
    } else {
      setError(true)
      setHelperText('Please select an option.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl error={error}>
        <FormLabel component='legend'>Pop quiz: MUI is...</FormLabel>
        <RadioGroup aria-label='quiz' name='quiz' value={value} onChange={handleRadioChange}>
          <FormControlLabel value='best' control={<Radio />} label='The best!' />
          <FormControlLabel value='worst' control={<Radio />} label='The worst.' />
        </RadioGroup>
        <FormHelperText>{helperText}</FormHelperText>
        <Button type='submit' variant='outlined' sx={{ mt: 3 }}>
          Check Answer
        </Button>
      </FormControl>
    </form>
  )
}

export default RadioShowError
