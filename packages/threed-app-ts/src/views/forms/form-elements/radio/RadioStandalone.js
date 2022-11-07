// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'

const RadioStandalone = () => {
  // ** State
  const [selectedValue, setSelectedValue] = useState('a')

  const handleChange = event => {
    setSelectedValue(event.target.value)
  }

  return (
    <div>
      <Radio
        value='a'
        onChange={handleChange}
        name='radio-button-demo'
        checked={selectedValue === 'a'}
        inputProps={{ 'aria-label': 'A' }}
      />
      <Radio
        value='b'
        onChange={handleChange}
        name='radio-button-demo'
        checked={selectedValue === 'b'}
        inputProps={{ 'aria-label': 'B' }}
      />
    </div>
  )
}

export default RadioStandalone
